def run_with_retries(operation, retries):
    last_error = None
    for _ in range(retries + 1):
        try:
            return operation()
        except RuntimeError as error:
            last_error = error
    raise last_error
