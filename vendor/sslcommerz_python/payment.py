"""Pure-requests re-implementation of sslcommerz_python.payment.

Mirrors the upstream class layout (SSLCommerz, SSLCSession, Validation) for the
attributes actually consumed by order.services. Only depends on stdlib + requests.
"""
from decimal import Decimal
from typing import Dict
from uuid import uuid4
import hashlib
import json
import requests

import sslcommerz_python._constants as const


class SSLCommerz:
    sslc_is_sandbox = True
    sslc_store_id = ""
    sslc_store_pass = ""
    sslc_mode_name = ""
    integration_data: Dict[str, str] = {}

    def __init__(self, sslc_is_sandbox=True, sslc_store_id="", sslc_store_pass="") -> None:
        self.sslc_mode_name = self.set_sslcommerz_mode(sslc_is_sandbox)
        self.sslc_is_sandbox = sslc_is_sandbox
        self.sslc_store_id = sslc_store_id
        self.sslc_store_pass = sslc_store_pass
        self.sslc_session_api = "https://" + self.sslc_mode_name + "." + const.SSLCZ_SESSION_API
        self.sslc_validation_api = "https://" + self.sslc_mode_name + "." + const.SSLCZ_VALIDATION_API

    @staticmethod
    def set_sslcommerz_mode(sslc_is_sandbox) -> str:
        if sslc_is_sandbox is True or sslc_is_sandbox == 1:
            return "sandbox"
        return "securepay"


class SSLCSession(SSLCommerz):
    def __init__(self, sslc_is_sandbox=True, sslc_store_id="", sslc_store_pass="") -> None:
        super().__init__(sslc_is_sandbox, sslc_store_id, sslc_store_pass)

    def set_urls(self, success_url, fail_url, cancel_url, ipn_url="") -> None:
        self.integration_data["success_url"] = success_url
        self.integration_data["fail_url"] = fail_url
        self.integration_data["cancel_url"] = cancel_url
        self.integration_data["ipn_url"] = ipn_url

    def set_product_integration(self, total_amount, currency, product_category, product_name, num_of_item, shipping_method, product_profile="None") -> None:
        self.integration_data["store_id"] = self.sslc_store_id
        self.integration_data["store_passwd"] = self.sslc_store_pass
        self.integration_data["tran_id"] = str(uuid4())
        self.integration_data["total_amount"] = total_amount
        self.integration_data["currency"] = currency
        self.integration_data["product_category"] = product_category
        self.integration_data["product_name"] = product_name
        self.integration_data["num_of_item"] = num_of_item
        self.integration_data["shipping_method"] = shipping_method
        self.integration_data["product_profile"] = product_profile

    def set_customer_info(self, name, email, address1, city, postcode, country, phone, address2="") -> None:
        self.integration_data["cus_name"] = name
        self.integration_data["cus_email"] = email
        self.integration_data["cus_add1"] = address1
        self.integration_data["cus_add2"] = address2
        self.integration_data["cus_city"] = city
        self.integration_data["cus_postcode"] = postcode
        self.integration_data["cus_country"] = country
        self.integration_data["cus_phone"] = phone

    def set_shipping_info(self, shipping_to, address, city, postcode, country) -> None:
        self.integration_data["ship_name"] = shipping_to
        self.integration_data["ship_add1"] = address
        self.integration_data["ship_city"] = city
        self.integration_data["ship_postcode"] = postcode
        self.integration_data["ship_country"] = country

    def set_additional_values(self, value_a="", value_b="", value_c="", value_d="") -> None:
        self.integration_data["value_a"] = value_a
        self.integration_data["value_b"] = value_b
        self.integration_data["value_c"] = value_c
        self.integration_data["value_d"] = value_d

    def init_payment(self):
        post_url = self.sslc_session_api
        post_data = self.integration_data
        response_sslc = requests.post(post_url, post_data)
        response_data = {}
        if response_sslc.status_code == 200:
            response_json = json.loads(response_sslc.text)
            if response_json.get("status") == "FAILED":
                response_data["status"] = response_json["status"]
                response_data["failedreason"] = response_json.get("failedreason", "")
                return response_data
            response_data["status"] = response_json["status"]
            response_data["sessionkey"] = response_json["sessionkey"]
            response_data["GatewayPageURL"] = response_json["GatewayPageURL"]
            return response_data
        try:
            response_json = json.loads(response_sslc.text)
        except ValueError:
            response_json = {"status": "FAILED", "failedreason": response_sslc.text}
        response_data["status"] = response_json.get("status", "FAILED")
        response_data["failedreason"] = response_json.get("failedreason", "")
        return response_data


class Validation(SSLCommerz):
    """Import-compatible placeholder.

    order.services imports this symbol but does not instantiate it; the
    project does its own SSLC validation via requests.get. Kept here so any
    future caller gets a working object.
    """
    def __init__(self, sslc_is_sandbox=True, sslc_store_id="", sslc_store_pass="") -> None:
        super().__init__(sslc_is_sandbox, sslc_store_id, sslc_store_pass)

    def validate_transaction(self, validation_id):
        params = {
            "val_id": validation_id,
            "store_id": self.sslc_store_id,
            "store_passwd": self.sslc_store_pass,
            "format": "json",
        }
        resp = requests.get(self.sslc_validation_api, params=params)
        if resp.status_code == 200:
            payload = resp.json()
            return {"status": payload.get("status", "FAILED"), "data": payload}
        return {
            "status": "FAILED",
            "data": f"Validation failed due to status code {resp.status_code}",
        }

    def validate_ipn_hash(self, ipn_data):
        if not (self.key_check(ipn_data, "verify_key") and self.key_check(ipn_data, "verify_sign")):
            return False
        check_params = {}
        for key in ipn_data["verify_key"].split(","):
            check_params[key] = ipn_data[key]
        store_pass_hash = hashlib.md5(self.sslc_store_pass.encode()).hexdigest()
        check_params["store_passwd"] = store_pass_hash
        check_params = self.sort_keys(check_params)
        sign_string = ""
        for key in check_params:
            sign_string += key[0] + "=" + str(key[1]) + "&"
        sign_string = sign_string.strip("&")
        return hashlib.md5(sign_string.encode()).hexdigest() == ipn_data["verify_sign"]

    @staticmethod
    def key_check(data_dict, check_key):
        return check_key in data_dict

    @staticmethod
    def sort_keys(data_dict):
        return [(key, data_dict[key]) for key in sorted(data_dict.keys())]
