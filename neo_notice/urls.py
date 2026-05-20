from django.urls import path, include

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("notices", views.get_notices, name="notices"),
    path("login", views.views_login, name = "login"),
    path("logout", views.views_logout, name = "logout"),
    path("signup", views.views_signup, name = "signup"),
    path("add_notices", views.add_notices, name="add_notices"),
    path("update_notices", views.update_notices, name="update_notices"),
    path("delete_notices", views.delete_notices, name="delete_notices"),
    path("esp/notices", views.get_all_notices_for_esp, name="esp_notices")
]
