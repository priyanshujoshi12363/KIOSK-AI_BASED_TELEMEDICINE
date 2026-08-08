import os
import sys

os.environ.setdefault("INSIGHTFACE_HOME", r"E:\insightface")


def main():
    from insightface.app import FaceAnalysis

    print("INSIGHTFACE_HOME:", os.environ["INSIGHTFACE_HOME"])
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    print("buffalo_l ready")
    return 0


if __name__ == "__main__":
    sys.exit(main())
