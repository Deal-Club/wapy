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


def build_workbook():
    """Construit et renvoie le classeur modèle (réutilisé par l'API pour le download)."""
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
        ("• CONSIGNES : dans l'onglet Infos, vous pouvez dicter le comportement du bot", None),
        ("  (ex. « Consigne : réservations » = envoyez le lien / transmettez au responsable).", None),
        ("  Le bot suit ces consignes. « À escalader systématiquement » = ce qu'il transmet à un humain.", None),
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
        widths=[32, 74],
        rows=[
            ["Nom du restaurant", "Le Maquis du Bonheur"],
            ["Ton de voix", "Chaleureux, accueillant, vouvoiement poli"],
            ["Horaires", "Tous les jours de 11h à 23h"],
            ["Adresse", "Quartier Fidjrossè, Cotonou, Bénin"],
            ["Repère / Accès", "En face de la pharmacie Fidjrossè, à 100 m du carrefour"],
            ["Téléphone / WhatsApp", "+229 01 90 00 00 00"],
            ["Devise", "FCFA (franc CFA)"],
            ["Moyens de paiement", "Espèces, MTN MoMo, Moov Money, carte bancaire"],
            ["Livraison / À emporter", "À emporter oui ; livraison sur Cotonou via Gozem et livreur maison"],
            ["Politique de réservation", "Réservation conseillée le week-end et pour les groupes"],
            ["Lien de réservation", "(votre lien de résa en ligne, ex. https://calendly.com/... ; laissez vide si aucun)"],
            ["Consigne : réservations", "S'il y a un lien de réservation, envoyez-le au client. Sinon, transmettez la demande au responsable."],
            ["Consigne : commandes / à emporter", "Prenez le détail (plats, quantités, nom, heure) puis transmettez au responsable."],
            ["À escalader systématiquement", "Réclamations, privatisations, événements / traiteur, ou toute demande de parler à un humain"],
        ],
    )

    # --- Menu ---
    menu = wb.create_sheet("Menu")
    _style_sheet(
        menu,
        headers=["Catégorie", "Plat", "Description", "Prix", "Allergènes / Régime"],
        widths=[16, 28, 42, 14, 26],
        rows=[
            ["Entrée", "Salade d'avocat", "Avocat, tomate, oignon", "1 500 FCFA", "végétarien, végan"],
            ["Plat", "Riz au gras", "Riz mijoté, légumes, viande", "2 500 FCFA", ""],
            ["Plat", "Poulet braisé", "Poulet mariné grillé, piment", "3 000 FCFA", ""],
            ["Plat", "Poisson braisé", "Tilapia grillé, sauce piment", "3 500 FCFA", "contient poisson"],
            ["Plat", "Pâte rouge + sauce arachide", "Pâte de maïs, sauce arachide", "2 000 FCFA", "contient arachide"],
            ["Plat", "Amiwo poulet", "Pâte de maïs tomatée + poulet", "2 500 FCFA", ""],
            ["Accompagnement", "Aloko", "Banane plantain frite", "1 000 FCFA", "végétarien, végan"],
            ["Dessert", "Salade de fruits", "Fruits frais de saison", "1 500 FCFA", "végan"],
            ["Boisson", "Jus de bissap", "Hibiscus maison", "1 000 FCFA", "végan"],
            ["Boisson", "Bière (33 cl)", "Béninoise ou autre", "1 000 FCFA", "contient gluten"],
            ["Boisson", "Eau minérale 1,5 L", "Possotomè", "500 FCFA", ""],
        ],
    )

    # --- FAQ ---
    faq = wb.create_sheet("FAQ")
    _style_sheet(
        faq,
        headers=["Question", "Réponse"],
        widths=[42, 66],
        rows=[
            ["Vous êtes ouverts aujourd'hui ?", "Oui, nous sommes ouverts tous les jours de 11h à 23h."],
            ["Où êtes-vous situés ?", "À Cotonou, quartier Fidjrossè, en face de la pharmacie Fidjrossè."],
            ["Acceptez-vous Mobile Money ?", "Oui, MTN MoMo et Moov Money, ainsi que les espèces et la carte."],
            ["Faites-vous la livraison ?", "Oui, livraison sur Cotonou via Gozem et notre livreur maison."],
            ["Avez-vous des plats végétariens ?", "Oui, par exemple l'aloko, la salade d'avocat et la salade de fruits."],
            ["Peut-on privatiser la salle ?", "Oui pour les événements. Je transmets votre demande à l'équipe."],
            ["Y a-t-il une salle climatisée ?", "Oui, nous avons une salle climatisée et une terrasse."],
        ],
    )

    return wb


def build():
    out = "docs/fiche-modele.xlsx"
    build_workbook().save(out)
    print(f"OK -> {out}")


if __name__ == "__main__":
    build()
