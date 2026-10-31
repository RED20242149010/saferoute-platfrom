
import json

from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt

from hotspot.models import RoadLocation, AccidentRecord
from road_damage.models import RoadDamageReport
from .models import RiskPrediction


# Predictor metric scoring rules

TEMPORAL_SCORES = {
    "Today, 18:30 (Peak Hour)": 8,
    "Today, 10:00 (Normal Hour)": 2,
    "Today, 22:00 (Night)": 0,
    "Tomorrow, 08:00 (Morning Peak)": 8,
}

WEATHER_SCORES = {
    "Monsoon Downpour": 12,
    "Heavy Rain": 12,
    "Cloudy": 4,
    "Clear Sky": 0,
    "Foggy": 8,
}

SURFACE_SCORES = {
    "Severely Damaged": 15,
    "Moderately Damaged": 10,
    "Minor Damage": 5,
    "Good Condition": 0,
}

CONGESTION_SCORES = {
    "Dense Flow": 15,
    "Moderate Flow": 8,
    "Light Flow": 3,
    "No Congestion": 0,
}

VELOCITY_SCORES = {
    "Above Safety Threshold": 10,
    "Normal Speed": 3,
    "Below Normal Speed": 0,
}


@csrf_exempt
@require_POST
def predict_risk(request):
    try:
        data = json.loads(request.body)

        location_id = data.get("location_id")

        if not location_id:
            return JsonResponse({
                "success": False,
                "message": "location_id is required."
            }, status=400)

        # Read predictor selections.
        temporal = data.get("temporal_frame")
        atmosphere = data.get("atmosphere")
        surface = data.get("surface")
        congestion = data.get("congestion")
        velocity = data.get("velocity")

        # Validate the selected values.
        selections = [
            (temporal, TEMPORAL_SCORES, "temporal_frame"),
            (atmosphere, WEATHER_SCORES, "atmosphere"),
            (surface, SURFACE_SCORES, "surface"),
            (congestion, CONGESTION_SCORES, "congestion"),
            (velocity, VELOCITY_SCORES, "velocity"),
        ]

        for value, allowed_values, field_name in selections:
            if value not in allowed_values:
                return JsonResponse({
                    "success": False,
                    "message": f"Invalid or missing value for {field_name}."
                }, status=400)

        # Find the selected active intersection.
        location = RoadLocation.objects.get(
            id=location_id,
            is_active=True
        )

        # Historical accident records.
        accidents = AccidentRecord.objects.filter(
            location=location
        ).count()

        # Unrepaired road damage records.
        damage_count = RoadDamageReport.objects.filter(
            location=location,
            repaired=False
        ).count()

        # Calculate individual score contributions.
        base_score = 10

        accident_score = min(accidents * 15, 30)
        damage_score = min(damage_count * 3, 30)

        temporal_score = TEMPORAL_SCORES[temporal]
        weather_score = WEATHER_SCORES[atmosphere]
        surface_score = SURFACE_SCORES[surface]
        congestion_score = CONGESTION_SCORES[congestion]
        velocity_score = VELOCITY_SCORES[velocity]

        # Calculate the final risk score.
        score = (
            base_score
            + accident_score
            + damage_score
            + temporal_score
            + weather_score
            + surface_score
            + congestion_score
            + velocity_score
        )

        score = min(score, 100)

        # Determine risk classification.
        if score <= 25:
            risk_level = "Low"
        elif score <= 50:
            risk_level = "Moderate"
        elif score <= 75:
            risk_level = "High"
        else:
            risk_level = "Extreme"

        # Explain the prediction.
        explanation = (
            f"Prediction for {location.name}. "
            f"Recorded accidents: {accidents}. "
            f"Unrepaired road damage: {damage_count}. "
            f"Temporal frame: {temporal} (+{temporal_score}). "
            f"Weather: {atmosphere} (+{weather_score}). "
            f"Road surface: {surface} (+{surface_score}). "
            f"Congestion: {congestion} (+{congestion_score}). "
            f"Vehicle velocity: {velocity} (+{velocity_score}). "
            f"Final heuristic risk score: {score}/100."
        )

        # Save the prediction in the database.
        prediction = RiskPrediction.objects.create(
            location=location,
            risk_score=score,
            risk_level=risk_level,
            explanation=explanation
        )

        return JsonResponse({
            "success": True,
            "prediction": {
                "id": prediction.id,
                "location": location.name,
                "risk_score": score,
                "risk_level": risk_level,
                "accidents": accidents,
                "unrepaired_damage": damage_count,
                "explanation": explanation,
                "predicted_at": prediction.predicted_at.isoformat()
            }
        })

    except RoadLocation.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Active road location not found."
        }, status=404)

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "Invalid JSON request."
        }, status=400)

    except Exception:
        return JsonResponse({
            "success": False,
            "message": "An unexpected prediction error occurred."
        }, status=500)


# Retrieve saved prediction history.
@require_GET
def prediction_history(request):
    predictions = (
        RiskPrediction.objects
        .select_related("location")
        .order_by("-predicted_at")[:100]
    )

    history = []

    for prediction in predictions:
        history.append({
            "id": prediction.id,
            "location": prediction.location.name,
            "risk_score": prediction.risk_score,
            "risk_level": prediction.risk_level,
            "predicted_at": prediction.predicted_at.isoformat(),
        })

    return JsonResponse({
        "success": True,
        "count": len(history),
        "history": history,
    })
