from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout, update_session_auth_hash
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # add this import at top
from django.db import IntegrityError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.decorators import login_required

import json
import requests

from . import models


def get_all_notices_for_esp(request):
    notices = []
    for notice in models.Notice.objects.filter(is_live=True):
        notices.append(notice.body)
    return JsonResponse({"notices": notices})
# Create your views here.
def index(request):
    # Check if there is no admin, then insert a new admin
    # with a dummy username and password which they would be prompted to change
    admins = models.User.objects.all()
    if len(admins) == 0:
        first_admin = models.User.objects.create_user(username="admin", password="admin123", first_name="Admin", last_name="First", email="admin@email.com")
        first_admin.save()
    return render(request, "neo_notice/index.html")

@login_required
def update_admin_credentials(request):
    if request.method == "POST":
        curr_user = request.user

        data = json.loads(request.body)
        username = data.get("username") if data.get("username") != "" else curr_user.username
        first_name = data.get("firstName") if data.get("firstName") != "" else curr_user.first_name
        last_name = data.get("lastName") if data.get("lastName") != "" else curr_user.last_name
        email = data.get("email") if data.get("email") != "" else curr_user.email
        new_password = data.get("password") if data.get("password") != "" else curr_user.password

        if username == "admin":
            return JsonResponse({"success": False, "error": "Username cannot be \'admin\'."}, status=400)
        if new_password == "admin123":
            return JsonResponse({"success": False, "error": "Password cannot be \'admin123\'."}, status=400)

        if new_password and new_password.strip() != "":
            try:
                validate_password(new_password, user=curr_user)
                curr_user.set_password(new_password)
                update_session_auth_hash(request, curr_user)
            except ValidationError as e:
                return JsonResponse({"error": e.messages}, status=400)

        try:
            curr_user.username = username
            curr_user.first_name = first_name
            curr_user.last_name = last_name
            curr_user.email = email
            curr_user.save()
        except IntegrityError:
            return JsonResponse({"success": False, "message": "Username or Email already exists."})

        return JsonResponse({"success": True, "username": curr_user.username})

    return JsonResponse({"error": "Post Request Required"}, status=400)

def get_notices(request):
    notices = []
    for notice in models.Notice.objects.filter(is_live=True):
        notices.append({
            "id": notice.id,           
            "creator_name": f"{notice.creator.first_name} {notice.creator.last_name}",
            "posted_at": notice.posted_at,
            "body": notice.body,
            "is_live": notice.is_live  
        })
    return JsonResponse({
        "notices_count": len(notices),
        "notices": notices
    })

@csrf_exempt
def add_notices(request):
    if request.method == "POST":
        data = json.loads(request.body)
        
        body = data.get("body")
        is_Live = data.get("is_live")
        
        notice = models.Notice.objects.create(
            creator=request.user, 
            body=body, 
            is_live=is_Live
        )
        
        
        
        return JsonResponse({"status": True}, status=200)
    return JsonResponse({"error": "POST request required"}, status=400)


@csrf_exempt
def update_notices(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        
        notice_id = data.get("notice_id")
        notice = models.Notice.objects.filter(id=notice_id).first()
        
        if not notice:
            return JsonResponse({"error": "Notice doesn't exist."})
        
        new_body = data.get("body")
        new_posted_at = data.get("posted_at")
        new_is_Live = data.get("is_live")
        
        if not new_body:
            return JsonResponse({"message": "Please update the body."}, status=400)
        
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required."}, status=401)
        
        # Enforce admin check from main branch
        if request.user.role == "admin":
            notice.body = new_body
            notice.posted_at = new_posted_at
            notice.is_live = new_is_Live
            notice.save()
            return JsonResponse({"status": True}, status=200)
        
        return JsonResponse({"error": "Unauthorized"}, status=403)


def add_notices(request):
    if request.method == "POST":
        data = json.loads(request.body)
        
        body = data.get("body")
        is_Live = data.get("is_live")
        
        notice = models.Notice.objects.create(creator = request.user, body = body, is_live = is_Live)
        
        return JsonResponse({"status":True}, status = 200)
    return JsonResponse({"error": "POST request required."}, status=400)
    
def delete_notices(request):
    if request.method == "PUT":
        
        data = json.loads(request.body)
        notice_id = data.get("notice_id")
        notice = models.Notice.objects.filter(id=notice_id).first()
        
        if not notice:
            return JsonResponse({"error": "Notice not found."})
        
        notice.delete()
        
        
        return JsonResponse({"success": True})
    
    return JsonResponse({"error": "Put Request Required"}, status=400)  


@csrf_exempt  
def views_login(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return JsonResponse({"success": True, "username": user.username})
        else:
            return JsonResponse({"success": False, "error" : "Invalid user credentials."})
    return JsonResponse({"error": "Post Request Required"}, status = 400)

def views_signup(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        email = request.POST["email"]
        
        if models.AdminUser.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "error" : "Username already exists."})
        
        try:
            user = models.AdminUser.objects.create_user(username=username, password=password, first_name=first_name, last_name=last_name, email=email)
            user.save()
        except IntegrityError:
            return JsonResponse({"success": False, "error" : "Username already exists."})

        return JsonResponse({"success": True, "username" : user.username})
    
    return JsonResponse({"error": "Post Request Required"}, status = 400)

def views_logout(request):
    auth_logout(request)
    return JsonResponse({"success": True, "message": "Logging out successful."})
