
from django.urls import path
from .views import predict_risk, prediction_history

urlpatterns = [
    path("predict/", predict_risk, name="predict_risk"),
    path("history/", prediction_history, name="prediction_history"),
]
