
from django.db import models
from hotspot.models import RoadLocation


class RiskPrediction(models.Model):
    location = models.ForeignKey(
        RoadLocation,
        on_delete=models.CASCADE,
        related_name="risk_predictions",
    )
    predicted_at = models.DateTimeField(auto_now_add=True)
    risk_score = models.PositiveSmallIntegerField()
    risk_level = models.CharField(max_length=20)
    explanation = models.TextField(blank=True)

    def __str__(self):
        return f"{self.location.name} - {self.risk_level}"

