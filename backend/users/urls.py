from django.urls import path
from .views import UserListCreateView, UserDetailView, RolesListView, LogoutView

urlpatterns = [
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('roles/', RolesListView.as_view(), name='roles-list'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
