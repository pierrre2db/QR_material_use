from app import create_app

# Créer une application en mode debug
app = create_app('development')

# Afficher les blueprints enregistrés
print("\n=== Blueprints enregistrés ===")
for name, blueprint in app.blueprints.items():
    print(f"- {name}: {blueprint}")
    print(f"  URL Prefix: {blueprint.url_prefix}")
    print(f"  Templates: {blueprint.template_folder}")
    print(f"  Static: {blueprint.static_folder}")
    print(f"  Root Path: {blueprint.root_path}")
    print(f"  Has routes: {hasattr(blueprint, 'deferred_functions')}")
    if hasattr(blueprint, 'deferred_functions'):
        print(f"  Routes: {blueprint.deferred_functions}")

# Afficher toutes les routes
print("\n=== Toutes les routes ===")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.rule} {list(rule.methods)}")

# Vérifier si le blueprint equipment est correctement enregistré
if 'equipment' in app.blueprints:
    print("\n=== Détails du blueprint equipment ===")
    bp = app.blueprints['equipment']
    print(f"Name: {bp.name}")
    print(f"URL Prefix: {bp.url_prefix}")
    print(f"Templates: {bp.template_folder}")
    print(f"Static: {bp.static_folder}")
    print(f"Root Path: {bp.root_path}")
    print(f"Has routes: {hasattr(bp, 'deferred_functions')}")
    if hasattr(bp, 'deferred_functions'):
        print(f"Routes: {bp.deferred_functions}")
else:
    print("\nLe blueprint 'equipment' n'est pas enregistré dans l'application")
