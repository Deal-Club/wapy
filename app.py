"""Point d'entrée Wapy — routes uniquement. La logique vit dans les modules."""
from fastapi import FastAPI


def create_app(deps: dict | None = None) -> FastAPI:
    app = FastAPI(title="Wapy")
    app.state.deps = deps or {}

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy"}

    return app


app = create_app()
