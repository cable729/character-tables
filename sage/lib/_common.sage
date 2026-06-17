# Shared utilities and check output formatting.

import json
import re

from sage.all import GF, CyclotomicField


def _json_safe(obj):
    """Convert Sage integers and other values to JSON-serializable Python types."""
    if obj is None or isinstance(obj, str):
        return obj
    if isinstance(obj, bool):
        return obj
    if type(obj) in (int, float):
        return obj
    try:
        if hasattr(obj, "is_integer") and obj.is_integer():
            return int(obj)
    except (TypeError, ValueError, AttributeError):
        pass
    try:
        return int(obj)
    except (TypeError, ValueError):
        pass
    try:
        return float(obj)
    except (TypeError, ValueError):
        pass
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    return str(obj)


def sage_emit(check_id, q, ok, details=None):
    q_out = int(q)
    line = "CHECK id=%s q=%s ok=%s" % (check_id, q_out, ok)
    if details is not None:
        line += " details_json=" + json.dumps(_json_safe(details))
    print(line)


def strip_latex(s):
    return re.sub(r"\s", "", s).replace("\\cdot", "*")
