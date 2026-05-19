from django.contrib.auth import authenticate, login as auth_login , logout as auth_logout
from django.shortcuts import render
from django.http import JsonResponse
import json

from . import models

# Create your views here.
def index(request):
    return render(request, "neo_notice/index.html")

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

def update_notices(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        
        notice_id = data.get("notice_id")
        
        notice = models.Notice.objects.filter(id = notice_id).first()
        
        if not notice: 
            return JsonResponse({"error": "Notice doesn't exist"})
        
        new_body = data.get("body")
        new_posted_at = data.get("posted_at")
        new_is_Live = data.get("is_live")
        
        if not new_body:
            return JsonResponse({"message": "Please update the body"}, status=400)
        
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required"}, status=401)
        
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
    return JsonResponse({"error": "POST request required"}, status=400)
    
def delete_notices(request):
    if request.method == "PUT":
        if request.user.role != "admin":
            return JsonResponse({"error": "Unauthorized"}, status=403)
        
        data = json.loads(request.body)
        notice_id = data.get("notice_id")
        notice = models.Notice.objects.filter(id=notice_id).first()
        if not notice:
            return JsonResponse({
                "error": "Notice not found."
            })
        notice.delete()
        return JsonResponse({
            "success": True
        })

    return JsonResponse({"error": "Put Request Required"}, status = 400)
  
    
def views_login(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username = username, password = password)
        if user is not None:
            if user.status != "approved":
                return JsonResponse({
                    "success": False,
                    "error": "Your account request is pending for approval"
                })
                
            auth_login(request, user)
            return JsonResponse({"success": True, "role": user.role, "username": user.username})
        else:
            return JsonResponse({"success": False, "error" : "Invalid User Credentials"})
    return JsonResponse({"error": "Post Request Required"}, status = 400)

def views_signup(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        email = request.POST["email"]
        role = request.POST["role"]
        status = request.POST["status"]
        
        if models.User.objects.filter(username = username).exists():
            return JsonResponse({"success": False, "error" : "Username already exists"})
        
        user = models.User.objects.create_user(username = username, password = password, first_name = first_name, last_name = last_name, email = email, role = role, status = status)
        
        return JsonResponse({"success": True, "role" : role, "username" : user.username })
    
    return JsonResponse({"error": "Post Request Required"}, status = 400)

def views_logout(request):
    auth_logout(request)
    return JsonResponse({"success": True, "message" : "Logging Out Successful" })
