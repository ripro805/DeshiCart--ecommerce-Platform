import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'deshicart.settings')
django.setup()

from django.contrib.auth import get_user_model
from product.models import Product, Category, Review, Brand
from order.models import Order, OrderItem, Payment
from wishlist.models import Wishlist, WishlistItem
from coupons.models import Coupon
from django.db import transaction
from decimal import Decimal

User = get_user_model()

def seed_data():
    print("Starting data generation...")
    with transaction.atomic():
        # 1. Create 50 Fake Users
        print("Creating users...")
        users = []
        for i in range(50):
            email = f"customer_{random.randint(10000, 99999)}@example.com"
            if not User.objects.filter(email=email).exists():
                user = User(email=email, first_name=f"Customer{i}", last_name="Fake")
                user.set_password("password123")
                users.append(user)
        User.objects.bulk_create(users)
        all_users = list(User.objects.filter(is_staff=False))

        # 2. Get some products
        all_products = list(Product.objects.all()[:1000])
        if not all_products:
            print("No products found! Please load products first.")
            return

        # 3. Create Coupons
        print("Creating coupons...")
        coupons_data = [
            ("WELCOME10", 10, "PERCENT"),
            ("FLAT500", 500, "FIXED"),
            ("SUMMER20", 20, "PERCENT"),
            ("SALE25", 25, "PERCENT"),
            ("MINUS200", 200, "FIXED"),
        ]
        active_coupons = []
        for code, val, type_ in coupons_data:
            c, _ = Coupon.objects.get_or_create(
                code=code,
                defaults={
                    "discount_type": type_,
                    "value": val,
                    "min_order": 1000 if type_ == "FIXED" else 0,
                    "is_active": True,
                    "max_uses": 100,
                    "valid_from": timezone.now() - timedelta(days=10),
                    "valid_to": timezone.now() + timedelta(days=30),
                }
            )
            active_coupons.append(c)

        # 4. Create Wishlists
        print("Creating wishlists...")
        for u in all_users[:20]:
            wl, _ = Wishlist.objects.get_or_create(user=u)
            for p in random.sample(all_products, random.randint(2, 5)):
                WishlistItem.objects.get_or_create(wishlist=wl, product=p)

        # 5. Create Reviews
        print("Creating reviews...")
        for _ in range(100):
            p = random.choice(all_products)
            u = random.choice(all_users)
            Review.objects.create(
                product=p,
                user=u,
                name=f"{u.first_name} {u.last_name}",
                ratings=random.randint(3, 5),
                status="APPROVED",
                comment="Great product, highly recommend! " + str(random.randint(1, 1000))
            )

        # 6. Set some products to low stock
        print("Setting low stock alerts...")
        for p in random.sample(all_products, 15):
            p.stock = random.randint(0, 4)
            p.save()

        # 7. Create Orders
        print("Creating orders and payments...")
        now = timezone.now()
        statuses = [Order.NOT_PAID, Order.READY_TO_SHIP, Order.SHIPPED, Order.DELIVERED, Order.DELIVERED, Order.DELIVERED, Order.CANCELLED]
        
        for i in range(300):
            u = random.choice(all_users)
            status = random.choice(statuses)
            
            # Select 1 to 4 products
            order_products = random.sample(all_products, random.randint(1, 4))
            total_price = Decimal(0)
            
            order = Order.objects.create(
                user=u,
                status=status,
                total_price=0  # will update
            )
            
            # Fake creation date
            random_days_ago = random.randint(0, 89)
            fake_date = now - timedelta(days=random_days_ago, hours=random.randint(0, 23))
            
            for p in order_products:
                qty = random.randint(1, 3)
                price = p.discounted_price if p.discounted_price else p.price
                total_price += price * qty
                OrderItem.objects.create(
                    order=order,
                    product=p,
                    quantity=qty,
                    price=price
                )
                
            order.total_price = total_price
            order.save()
            Order.objects.filter(id=order.id).update(created_at=fake_date)

            # Create payment if shipped or delivered
            if status in [Order.SHIPPED, Order.DELIVERED, Order.READY_TO_SHIP]:
                p_status = Payment.SUCCESS
            elif status == Order.CANCELLED:
                p_status = Payment.CANCELLED
            else:
                p_status = Payment.PENDING
                
            payment = Payment.objects.create(
                order=order,
                amount=total_price,
                status=p_status,
                transaction_id=f"TXN-{random.randint(1000000, 9999999)}",
                bank_tran_id=f"BNK-{random.randint(1000000, 9999999)}"
            )
            Payment.objects.filter(id=payment.id).update(created_at=fake_date, updated_at=fake_date)

    print("Data generation complete!")
    print(f"Total Users: {User.objects.count()}")
    print(f"Total Orders: {Order.objects.count()}")
    print(f"Total Payments: {Payment.objects.count()}")
    print(f"Total Reviews: {Review.objects.count()}")

if __name__ == '__main__':
    seed_data()
