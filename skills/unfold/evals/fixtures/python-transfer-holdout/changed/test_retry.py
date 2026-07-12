import unittest

from retry import run_with_retries


class RetryTest(unittest.TestCase):
    def test_returns_first_success(self):
        self.assertEqual(run_with_retries(lambda: "ok", retries=2), "ok")

    def test_retries_twice_after_the_initial_attempt(self):
        attempts = 0

        def succeeds_on_third_attempt():
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise RuntimeError("temporary")
            return "ok"

        self.assertEqual(run_with_retries(succeeds_on_third_attempt, retries=2), "ok")
        self.assertEqual(attempts, 3)


if __name__ == "__main__":
    unittest.main()
