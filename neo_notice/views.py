from django.shortcuts import render
from django.http import JsonResponse

from . import models

# Create your views here.
def index(request):
    return render(request, "neo_notice/index.html")

def get_notices(request):
    notices = []
    for notice in models.Notice.objects.all():
        notices.append({
            "creator_name": f"{notice.creator.first_name} {notice.creator.last_name}",
            "posted_at": notice.posted_at,
            "body": notice.body
        })
    return JsonResponse({
        "notices_count": len(notices),
        "notices": notices
    })
