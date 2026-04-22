from django.urls import path
from .views import UserListCreateView, UserDetailView, RolesListView

urlpatterns = [
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('roles/', RolesListView.as_view(), name='roles-list'),
]
