import os, sys
sys.path.insert(0, os.path.dirname(__file__))

# `saas.auth` refuse de se charger sans JWT_SECRET (cf. son garde-fou) : sans
# cette valeur de test, toute la suite échouerait à l'import. `setdefault` pour
# qu'un secret déjà présent dans l'environnement reste prioritaire.
os.environ.setdefault("JWT_SECRET", "jwt-secret-de-test-" + "x" * 16)

# Le regroupement des messages en rafale attend jusqu'à 6 s en production. En
# test on traverse le même chemin, sans l'attente.
os.environ.setdefault("WAPY_REGROUPEMENT", "0")
