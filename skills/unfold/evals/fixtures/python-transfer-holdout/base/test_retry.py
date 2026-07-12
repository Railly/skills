import unittest

from retry import run_with_retries


class RetryTest(unittest.TestCase):
    def test_returns_first_success(self):
        self.assertEqual(run_with_retries(lambda: "ok", retries=2), "ok")


if __name__ == "__main__":
    unittest.main()
