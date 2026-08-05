"""Génère un modèle Excel de fiche restaurant, prêt à uploader sur Google Sheets.

Onglets lus par Wapy : 'Infos', 'Menu', 'FAQ' (ligne 1 = en-têtes, ignorée à la lecture).
L'onglet 'Lisez-moi' est ignoré par le bot (documentation pour l'utilisateur).

Usage : python tools/generate_fiche_xlsx.py
Sortie : docs/fiche-modele.xlsx
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# --- Palette ---
HEADER_FILL = PatternFill("solid", fgColor="C25B3E")   # terracotta
HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
BAND_FILL = PatternFill("solid", fgColor="F4F1EA")     # crème
TITLE_FONT = Font(bold=True, size=14, color="C25B3E")
WRAP = Alignment(vertical="top", wrap_text=True)
THIN = Side(style="thin", color="D9D2C5")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def _style_sheet(ws, headers, widths, rows):
    # En-tête
    for col, (title, width) in enumerate(zip(headers, widths), start=1):
        cell = ws.cell(row=1, column=col, value=title)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center", horizontal="left")
        cell.border = BORDER
        ws.column_dimensions[get_column_letter(col)].width = width
    ws.row_dimensions[1].height = 22
    # Données
    for r, row in enumerate(rows, start=2):
        for c, value in enumerate(row, start=1):
            cell = ws.cell(row=r, column=c, value=value)
            cell.alignment = WRAP
            cell.border = BORDER
            if r % 2 == 0:
                cell.fill = BAND_FILL
    ws.freeze_panes = "A2"
    ws.sheet_view.showGridLines = False


def build():
    wb = Workbook()

    # --- Lisez-moi ---
    ws = wb.active
    ws.title = "Lisez-moi"
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 100
    lignes = [
        ("Fiche restaurant — mode d'emploi", TITLE_FONT),
        ("", None),
        ("Ce classeur alimente votre assistant WhatsApp. Remplissez les 3 onglets ci-dessous.", None),
        ("", None),
        ("• Onglet « Infos » : renseignements généraux (horaires, adresse, ton, etc.).", None),
        ("• Onglet « Menu » : vos plats avec prix et allergènes.", None),
        ("• Onglet « FAQ » : les questions fréquentes et vos réponses validées.", None),
        ("", None),
        ("Règles importantes :", Font(bold=True)),
        ("• Ne renommez PAS les onglets « Infos », « Menu », « FAQ » (le bot les cherche par nom).", None),
        ("• Ne supprimez pas la 1re ligne (les en-têtes) de chaque onglet.", None),
        ("• Les exemples sont là pour vous guider : remplacez-les par vos vraies infos.", None),
        ("• Ce que le bot ne doit jamais traiter seul (réservations, commandes…) : listez-le", None),
        ("  dans la rubrique « À escalader systématiquement » de l'onglet Infos.", None),
        ("", None),
        ("Ensuite : Fichier → Importer ce classeur dans Google Sheets, puis partagez-le", None),
        ("en édition avec l'e-mail du compte de service (fourni par votre intégrateur).", None),
    ]
    for i, (text, font) in enumerate(lignes, start=1):
        cell = ws.cell(row=i, column=1, value=text)
        cell.alignment = WRAP
        if font:
            cell.font = font

    # --- Infos ---
    infos = wb.create_sheet("Infos")
    _style_sheet(
        infos,
        headers=["Rubrique", "Contenu"],
        widths=[32, 70],
        rows=[
            ["Nom du restaurant", "Chez Léon"],
            ["Ton de voix", "Chaleureux, professionnel, tutoiement léger"],
            ["Horaires", "Mardi-Dimanche 12h-14h et 19h-22h, fermé le lundi"],
            ["Adresse", "12 rue de la Paix, 31000 Toulouse"],
            ["Accès / Parking", "Métro Jean Jaurès, parking gratuit à 50 m"],
            ["Téléphone", "05 61 00 00 00"],
            ["Politique de réservation", "Réservation conseillée le week-end"],
            ["Livraison / À emporter", "À emporter oui ; livraison via Uber Eats"],
            ["À escalader systématiquement", "Réservations, commandes, réclamations, privatisations, demandes de groupe"],
        ],
    )

    # --- Menu ---
    menu = wb.create_sheet("Menu")
    _style_sheet(
        menu,
        headers=["Catégorie", "Plat", "Description", "Prix", "Allergènes / Régime"],
        widths=[16, 26, 40, 10, 26],
        rows=[
            ["Entrée", "Salade César", "Poulet grillé, parmesan, croûtons", "9€", "contient gluten, œuf"],
            ["Plat", "Burger maison", "Bœuf, cheddar, frites maison", "15€", "contient gluten, lactose"],
            ["Plat", "Risotto aux légumes", "Légumes de saison, parmesan", "14€", "végétarien, sans gluten"],
            ["Dessert", "Tiramisu maison", "Recette traditionnelle", "7€", "contient lactose, œuf"],
            ["Boisson", "Côtes du Rhône (verre)", "Vin rouge", "5€", ""],
        ],
    )

    # --- FAQ ---
    faq = wb.create_sheet("FAQ")
    _style_sheet(
        faq,
        headers=["Question", "Réponse"],
        widths=[40, 62],
        rows=[
            ["Vous avez une terrasse ?", "Oui, une terrasse chauffée ouverte toute l'année."],
            ["Acceptez-vous les cartes ?", "Oui, carte bancaire et tickets restaurant."],
            ["Avez-vous des plats végétariens ?", "Oui, plusieurs plats végétariens et véganes."],
            ["Êtes-vous accessibles PMR ?", "Oui, le restaurant est accessible aux personnes à mobilité réduite."],
            ["Peut-on venir avec un chien ?", "Les chiens sont les bienvenus en terrasse."],
        ],
    )

    out = "docs/fiche-modele.xlsx"
    wb.save(out)
    print(f"OK -> {out}")


if __name__ == "__main__":
    build()
