import logging
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from core.permissions import IsAdminUser

logger = logging.getLogger(__name__)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['groups'] = list(user.groups.values_list('name', flat=True))
        token['is_superuser'] = user.is_superuser
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class LogoutView(APIView):
    """
    Blacklists the refresh token so it cannot be reused after logout.
    Requires: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            logger.warning(f"Logout with invalid token: {e}")
        return Response({'detail': 'Successfully logged out.'}, status=200)


# ── User Management (Admin only) ─────────────────────────────────────────────

AVAILABLE_ROLES = [
    'Admin',
    'Brand Manager',
    'Factory Manager',
    'Worker',
    'Accountant',
    'General Manager',
]


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'groups': list(user.groups.values_list('name', flat=True)),
        'date_joined': user.date_joined.isoformat(),
    }


class UserListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.prefetch_related('groups').order_by('date_joined')
        return Response([_serialize_user(u) for u in users])

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        email = request.data.get('email', '').strip()
        role = request.data.get('role', '')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=400)

        if role and role not in AVAILABLE_ROLES:
            return Response({'error': f'Invalid role. Choose from: {", ".join(AVAILABLE_ROLES)}'}, status=400)

        # Enforce Django password validators
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response({'error': list(e.messages)}, status=400)

        user = User.objects.create_user(username=username, password=password, email=email)

        if role:
            group, _ = Group.objects.get_or_create(name=role)
            user.groups.add(group)

        return Response(_serialize_user(user), status=201)


class UserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return User.objects.prefetch_related('groups').get(pk=pk)
        except User.DoesNotExist:
            return None

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=404)

        if 'email' in request.data:
            user.email = request.data['email']

        if 'password' in request.data and request.data['password']:
            new_password = request.data['password']
            try:
                validate_password(new_password, user=user)
            except DjangoValidationError as e:
                return Response({'error': list(e.messages)}, status=400)
            user.set_password(new_password)

        if 'is_active' in request.data:
            user.is_active = request.data['is_active']

        if 'role' in request.data:
            role = request.data['role']
            user.groups.clear()
            if role:
                if role not in AVAILABLE_ROLES:
                    return Response({'error': 'Invalid role.'}, status=400)
                group, _ = Group.objects.get_or_create(name=role)
                user.groups.add(group)

        user.save()
        return Response(_serialize_user(user))

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=404)
        if user == request.user:
            return Response({'error': 'Cannot delete your own account.'}, status=400)
        user.delete()
        return Response(status=204)


class RolesListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(AVAILABLE_ROLES)
