"""Command-line DO simulation to test FIS output and VFD control.

Run with DO setpoint and reading to compute the fuzzy controller output.
Optionally apply the resulting speed to the connected VFD.
"""
from __future__ import annotations

import argparse
import logging
import sys
from typing import Optional

import config
from fis_controller import FISController

try:
    from vanatronCenter import VanatronCenter
except Exception:  # pragma: no cover - allow running without hardware stack present
    VanatronCenter = None  # type: ignore


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Simulate dissolved oxygen control by computing the FIS output "
            "and optionally commanding the VFD."
        )
    )
    parser.add_argument(
        "--do-setpoint",
        type=float,
        required=True,
        help="Desired dissolved oxygen setpoint in mg/L.",
    )
    parser.add_argument(
        "--do-reading",
        type=float,
        required=True,
        help="Current dissolved oxygen reading in mg/L.",
    )
    parser.add_argument(
        "--delta-error",
        type=float,
        default=None,
        help=(
            "Optional delta error in mg/L for successive control steps. "
            "Defaults to 0 when omitted."
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help=(
            "Send the computed speed to the real VFD using Modbus. "
            "Skipped when not provided."
        ),
    )
    parser.add_argument(
        "--log-level",
        default=config.LOG_LEVEL,
        help="Logging level (default taken from config.LOG_LEVEL).",
    )
    return parser.parse_args(argv)


def setup_logging(level: str) -> None:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def compute_speed(do_setpoint: float, do_reading: float, delta_error: Optional[float]) -> float:
    fis = FISController(config.FIS_MIN_POWER, config.FIS_MAX_POWER)
    error = do_setpoint - do_reading
    delta = delta_error if delta_error is not None else 0.0
    logging.getLogger(__name__).info(
        "Calculated control error: %.3f mg/L, delta_error: %.3f mg/L", error, delta
    )
    speed = fis.calculate_speed(error, delta)
    logging.getLogger(__name__).info("FIS output speed: %.2f%%", speed)
    return speed


def apply_speed_to_vfd(speed: float) -> bool:
    if VanatronCenter is None:
        logging.getLogger(__name__).error(
            "VFD control stack is unavailable. Ensure hardware modules are installed."
        )
        return False

    logger = logging.getLogger(__name__)
    center = VanatronCenter(port='COM5')
    try:
        center.addVFD("vfd", config.VFD_SLAVE_ID)
        logger.info(
            "Applying speed %.2f%% to VFD (slave ID %s)", speed, config.VFD_SLAVE_ID
        )
        if not center.vfd.runForward():
            logger.warning("Failed to issue run-forward command to VFD.")
        success = center.vfd.setSpeed(speed)
        logger.info("setSpeed returned %s", success)
        return success
    finally:
        center.close()


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    setup_logging(args.log_level)

    speed = compute_speed(args.do_setpoint, args.do_reading, args.delta_error)
    print(f"Computed VFD speed: {speed:.2f}%")

    if args.apply:
        success = apply_speed_to_vfd(speed)
        if success:
            print("VFD command applied successfully.")
            return 0
        print("Failed to apply VFD command. Check logs for details.")
        return 1

    print("--apply not specified; skipping hardware interaction.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
