from django.contrib.auth.models import User, Group
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from core.permissions import IsAdminUser


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['groups'] = list(user.groups.values_list('name', flat=True))
        token['is_superuser'] = user.is_superuser
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


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

        # Prevent removing your own admin
        if user == request.user and 'role' in request.data:
            pass  # allow — admin can change their own role (be careful)

        if 'email' in request.data:
            user.email = request.data['email']

        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])

        if 'is_active' in request.data:
            user.is_active = request.data['is_active']

        if 'role' in request.data:
            role = request.data['role']
            user.groups.clear()
            if role:
                if role not in AVAILABLE_ROLES:
                    return Response({'error': f'Invalid role.'}, status=400)
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
