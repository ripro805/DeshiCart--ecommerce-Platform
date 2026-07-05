import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'deshicart.settings')
django.setup()
from django.apps import apps

models_to_check = [
    'admin_panel.ActivityLog', 'admin_panel.StaffProfile', 
    'returns.ReturnRequest', 'returns.ReturnItem', 
    'notifications_app.Notification', 
    'marketing.Banner', 'marketing.Campaign', 'marketing.NewsletterSubscriber', 
    'cms.Page', 
    'support.SupportTicket', 'support.TicketReply', 
    'shipping.ShippingZone', 'shipping.ShippingRate'
]

for m in models_to_check:
    app, model = m.split('.')
    model_cls = apps.get_model(app, model)
    fields = [f.name for f in model_cls._meta.fields]
    print(f"{m}: {fields}")
