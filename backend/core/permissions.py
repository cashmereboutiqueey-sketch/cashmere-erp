from rest_framework.permissions import BasePermission

BRAND_ROLES = {'Brand Manager', 'Admin'}
FACTORY_ROLES = {'Factory Manager', 'Worker', 'Admin'}
FINANCE_ROLES = {'Brand Manager', 'Factory Manager', 'Accountant', 'General Manager', 'Admin'}
ADMIN_ROLES = {'Admin'}


def _groups(user):
    if not user or not user.is_authenticated:
        return set()
    if user.is_superuser:
        return {'Admin'}
    return set(user.groups.values_list('name', flat=True))


class HasBrandAccess(BasePermission):
    message = 'Brand Manager or Admin role required.'

    def has_permission(self, request, view):
        return bool(_groups(request.user) & BRAND_ROLES) if request.user else False


class HasFactoryAccess(BasePermission):
    message = 'Factory Manager or Worker role required.'

    def has_permission(self, request, view):
        return bool(_groups(request.user) & FACTORY_ROLES) if request.user else False


class HasFinanceAccess(BasePermission):
    message = 'Manager or Accountant role required to access financial data.'

    def has_permission(self, request, view):
        return bool(_groups(request.user) & FINANCE_ROLES) if request.user else False


class IsAdminUser(BasePermission):
    message = 'Admin role required.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name='Admin').exists()
