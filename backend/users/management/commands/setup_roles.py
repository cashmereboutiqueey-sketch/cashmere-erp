from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Setup user roles and permissions'

    def handle(self, *args, **kwargs):
        # Define Roles
        roles = {
            'Brand Manager': [
                # Add specific permissions codenames here
                'view_product', 'add_product', 'change_product', 'delete_product',
                'view_brandorder', 'add_brandorder', 'change_brandorder',
                'view_inventoryitem', 'change_inventoryitem',
            ],
            'Factory Manager': [
                'view_productionjob', 'add_productionjob', 'change_productionjob',
                'view_worker', 'add_worker', 'change_worker',
                'view_material', 'add_material', 'change_material',
            ],
            'Worker': [
                # Minimal access
                'view_productionjob',
            ]
        }

        for role_name, permissions in roles.items():
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created group: {role_name}'))
            else:
                self.stdout.write(f'Group exists: {role_name}')

            # clear existing permissions to ensure fresh start
            group.permissions.clear()

            for perm_code in permissions:
                try:
                    perm = Permission.objects.get(codename=perm_code)
                    group.permissions.add(perm)
                    self.stdout.write(f'  Added permission: {perm_code}')
                except Permission.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  Permission not found: {perm_code}'))

        self.stdout.write(self.style.SUCCESS('Roles setup completed'))
