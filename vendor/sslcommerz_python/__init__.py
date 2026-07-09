"""In-repo drop-in replacement for sslcommerz-python 0.0.7.

The upstream package hard-pins astroid==2.3.3 which requires typed-ast<2.0;
typed-ast's C extension fails to build on Python 3.13+ (missing PyArena / code.h).
This vendored copy depends only on requests.

Public API preserved for order.services:
    from sslcommerz_python.payment import SSLCSession, Validation
"""
__all__ = ["SSLCSession", "Validation", "SSLCommerz"]
