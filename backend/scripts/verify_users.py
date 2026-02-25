import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

def check_and_create_users():
    print("Checking users...")
    users = User.objects.all()
    for u in users:
        print(f"User: {u.username}, Superuser: {u.is_superuser}, Groups: {[g.name for g in u.groups.all()]}")

    if not users.exists():
        print("No users found. Creating 'admin'...")
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        print("Created superuser 'admin' with password 'admin'")
    
    # ensure groups exist
    brand_manager_group = Group.objects.filter(name='Brand Manager').first()
    if brand_manager_group and not User.objects.filter(username='brand_mgr').exists():
        u = User.objects.create_user('brand_mgr', 'brand@example.com', 'password123')
        u.groups.add(brand_manager_group)
        print("Created 'brand_mgr' user")

    factory_manager_group = Group.objects.filter(name='Factory Manager').first()
    if factory_manager_group and not User.objects.filter(username='factory_mgr').exists():
        u = User.objects.create_user('factory_mgr', 'factory@example.com', 'password123')
        u.groups.add(factory_manager_group)
        print("Created 'factory_mgr' user")

if __name__ == "__main__":
    check_and_create_users()
