from decimal import Decimal


def normalize_assignment_score(score, max_points) -> Decimal:
    score_decimal = Decimal(score)
    max_points_decimal = Decimal(max_points)
    if score_decimal == 0 or max_points_decimal <= 0:
        return Decimal("0")
    if max_points_decimal < 10:
        return ((score_decimal + (Decimal("10") - max_points_decimal)) / Decimal("10")) * Decimal("100")
    return (score_decimal / max_points_decimal) * Decimal("100")
