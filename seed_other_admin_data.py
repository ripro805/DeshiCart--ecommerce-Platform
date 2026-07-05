import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'deshicart.settings')
django.setup()

from django.contrib.auth import get_user_model
from product.models import Product
from order.models import Order, OrderItem
from admin_panel.models import StaffProfile, ActivityLog
from returns.models import ReturnRequest, ReturnItem
from notifications_app.models import Notification
from marketing.models import Banner, Campaign, NewsletterSubscriber
from cms.models import Page
from support.models import SupportTicket, TicketReply
from shipping.models import ShippingZone, ShippingRate
from django.db import transaction
from decimal import Decimal

User = get_user_model()

def seed_data():
    print("Starting extended data generation...")
    with transaction.atomic():
        all_users = list(User.objects.filter(is_staff=False))
        all_orders = list(Order.objects.all())
        all_products = list(Product.objects.all()[:500])
        now = timezone.now()

        if not all_users or not all_orders:
            print("Run seed_admin_data.py first to populate users and orders.")
            return

        # 1. Staff Profiles
        print("Creating staff profiles...")
        staff_users = []
        for i in range(5):
            email = f"staff_{random.randint(1000, 9999)}@deshicart.com"
            user = User.objects.create(email=email, first_name=f"Staff{i}", last_name="Member", is_staff=True)
            user.set_password("staffpass123")
            user.save()
            staff_users.append(user)
            StaffProfile.objects.create(
                user=user, 
                role=random.choice(["Manager", "Support", "Editor", "Admin"]),
                permissions={"can_view_orders": True},
                notes="Created by seeder"
            )

        # 2. Return Requests
        print("Creating return requests...")
        for _ in range(20):
            order = random.choice(all_orders)
            items = list(order.items.all())
            if not items:
                continue
            
            rr = ReturnRequest.objects.create(
                order=order,
                user=order.user,
                reason=random.choice(["Defective item", "Wrong size", "Not as described", "Changed mind"]),
                status=random.choice(["PENDING", "APPROVED", "REJECTED", "REFUNDED"]),
                refund_amount=sum(i.price * i.quantity for i in items[:2]),
                admin_note="Processing." if random.random() > 0.5 else ""
            )
            for item in items[:2]:
                ReturnItem.objects.create(
                    return_request=rr,
                    order_item=item,
                    quantity=random.randint(1, item.quantity),
                    condition=random.choice(["Unopened", "Opened, Like New", "Damaged"])
                )

        # 3. Notifications
        print("Creating notifications...")
        for _ in range(50):
            Notification.objects.create(
                user=random.choice(all_users + staff_users),
                type=random.choice(["ORDER", "SYSTEM", "PROMO", "ALERT"]),
                title="System Update " + str(random.randint(1, 100)),
                body="This is an automated notification body.",
                link="/account",
                is_read=random.choice([True, False])
            )

        # 4. Marketing
        print("Creating marketing campaigns...")
        Banner.objects.create(title="Summer Sale", subtitle="Up to 50% off", position="hero", is_active=True, order=1, starts_at=now, ends_at=now+timedelta(days=30))
        Banner.objects.create(title="New Arrivals", subtitle="Check out the latest tech", position="sidebar", is_active=True, order=2, starts_at=now, ends_at=now+timedelta(days=30))
        Campaign.objects.create(name="Summer Clearance", description="Clearance sale for summer items", is_active=True, starts_at=now, ends_at=now+timedelta(days=15))
        Campaign.objects.create(name="Black Friday Preview", description="Early access for members", is_active=False, starts_at=now+timedelta(days=100), ends_at=now+timedelta(days=105))
        
        subs = []
        for i in range(100):
            subs.append(NewsletterSubscriber(email=f"sub_{random.randint(10000,99999)}@example.com"))
        NewsletterSubscriber.objects.bulk_create(subs)

        # 5. CMS Pages
        print("Creating CMS pages...")
        pages = [
            ("about-us", "About Us", "We are the best ecommerce platform in the country."),
            ("terms", "Terms of Service", "By using this site you agree to our terms."),
            ("privacy", "Privacy Policy", "We protect your data."),
            ("faq", "FAQ", "Frequently Asked Questions."),
        ]
        for slug, title, body in pages:
            Page.objects.get_or_create(slug=slug, defaults={"title": title, "body": body, "is_published": True})

        # 6. Support Tickets
        print("Creating support tickets...")
        for _ in range(15):
            u = random.choice(all_users)
            ticket = SupportTicket.objects.create(
                user=u,
                subject="Help with my order " + str(random.randint(100, 999)),
                message="I have not received my order yet. Please help.",
                status=random.choice(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
                priority=random.choice(["LOW", "MEDIUM", "HIGH"])
            )
            # Add replies
            for _ in range(random.randint(0, 3)):
                is_staff = random.choice([True, False])
                reply_u = random.choice(staff_users) if is_staff else u
                TicketReply.objects.create(
                    ticket=ticket,
                    user=reply_u,
                    message="Reply message " + str(random.randint(1, 100)),
                    is_staff_reply=is_staff
                )

        # 7. Shipping Zones
        print("Creating shipping zones...")
        z1, _ = ShippingZone.objects.get_or_create(name="Domestic", defaults={"countries": ["BD"], "is_active": True})
        z2, _ = ShippingZone.objects.get_or_create(name="International", defaults={"countries": ["US", "GB", "CA"], "is_active": True})
        
        ShippingRate.objects.get_or_create(zone=z1, name="Standard", defaults={"min_weight": 0, "max_weight": 10, "price": Decimal("50.00"), "courier": "Pathao", "estimated_days": 3, "is_active": True})
        ShippingRate.objects.get_or_create(zone=z1, name="Express", defaults={"min_weight": 0, "max_weight": 10, "price": Decimal("120.00"), "courier": "RedX", "estimated_days": 1, "is_active": True})
        ShippingRate.objects.get_or_create(zone=z2, name="DHL International", defaults={"min_weight": 0, "max_weight": 5, "price": Decimal("1500.00"), "courier": "DHL", "estimated_days": 14, "is_active": True})

        # 8. Activity Logs
        print("Creating activity logs...")
        for _ in range(50):
            ActivityLog.objects.create(
                user=random.choice(staff_users),
                action=random.choice(["UPDATE_ORDER", "DELETE_PRODUCT", "APPROVE_RETURN", "LOGIN"]),
                target_type="System",
                target_id=str(random.randint(1, 1000)),
                description="Performed an administrative action",
                ip_address="192.168.1." + str(random.randint(1, 255))
            )

    print("Extended data generation complete!")

if __name__ == '__main__':
    seed_data()
