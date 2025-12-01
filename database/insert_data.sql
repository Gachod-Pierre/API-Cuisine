-- Inserer des cuisines (basé sur la section 1.1 du PDF)
INSERT INTO Cuisines (name) VALUES
    ('Asiatique'),
    ('Italienne'),
    ('Chinoise'),
    ('Française'),
    ('Mexicaine'),
    ('Indienne'),
    ('Méditerranéenne'),
    ('Américaine'),
    ('Thaïlandaise'),
    ('Japonaise');

-- Inserer des objectifs (goals) - basé sur la section 1.1 du PDF
INSERT INTO Goals (name) VALUES
    ('Perte de poids'),
    ('Riche en protéines'),
    ('Riche en nutriments'),
    ('Faible en calories'),
    ('Rapide et facile'),
    ('Adapté aux familles'),
    ('Économique'),
    ('Occasions spéciales');

-- Inserer des catégories diététiques (Dietary Information) - basé sur la section 1.1 du PDF
INSERT INTO DietaryInformation (name) VALUES
    ('Sans produits laitiers'),
    ('Sans Oeufs'),
    ('Sans sucre'),
    ('Sans gluten'),
    ('Végétarien'),
    ('Végétalien'),
    ('Paléo'),
    ('Cétogène'),
    ('Faible en glucides'),
    ('Faible en matières grasses');

-- Inserer des catégories d'allergies (Allergies Information) - basé sur la section 1.1 du PDF
INSERT INTO AllergiesInformation (name) VALUES
    ('Gluten'),
    ('Produits laitiers'),
    ('Noix'),
    ('Fruits de mer'),
    ('Soja'),
    ('Oeufs'),
    ('Blé');

-- Inserer des ingrédients (Ingredients) - CORRIGÉ: supprimé quantity qui n'existe pas dans le schéma
INSERT INTO Ingredients (name, unit) VALUES
    ('Poulet', 'grammes'),
    ('Pâtes', 'grammes'),
    ('Tomates', 'unités'),
    ('Huile d''olive', 'cuillères à soupe'),
    ('Laitue', 'feuilles'),
    ('Parmesan', 'grammes'),
    ('Croûtons', 'unités'),
    ('Vinaigrette césar', 'cuillères à soupe'),
    ('Ail', 'gousses'),
    ('Oignons', 'unités'),
    ('Basilic', 'feuilles'),
    ('Mozzarella', 'grammes');

-- Inserer des recettes (Recipes) - CORRIGÉ: ajusté les IDs pour correspondre aux nouvelles données
INSERT INTO Recipes (title, description, image_url, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id) VALUES
    ('Poulet Alfredo', 'Une délicieuse recette de pâtes au poulet', 'poulet_alfredo.jpg', 2, 2, 1, 2),
    ('Salade César', 'Une salade classique avec une vinaigrette crémeuse', 'salade_cesar.jpg', 10, 1, 5, 6),
    ('Pasta Végétarienne', 'Pâtes aux légumes et basilic frais', 'pasta_vegetarienne.jpg', 2, 3, 5, NULL),
    ('Stir-Fry Asiatique', 'Poulet sauté aux légumes style asiatique', 'stir_fry_asiatique.jpg', 1, 2, NULL, 4);

-- AJOUT MANQUANT: Table de liaison RecipeIngredients
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
    -- Pour Poulet Alfredo (recipe_id = 1)
    (1, 1, 200),  -- Poulet, 200g
    (1, 2, 300),  -- Pâtes, 300g
    (1, 3, 2),    -- Tomates, 2 unités
    (1, 4, 2),    -- Huile d'olive, 2 c.à.s
    -- Pour Salade César (recipe_id = 2)
    (2, 5, 1),    -- Laitue, 1 salade
    (2, 6, 50),   -- Parmesan, 50g
    (2, 7, 20),   -- Croûtons, 20 unités
    (2, 8, 3),    -- Vinaigrette césar, 3 c.à.s
    -- Pour Pasta Végétarienne (recipe_id = 3)
    (3, 2, 250),  -- Pâtes, 250g
    (3, 3, 3),    -- Tomates, 3 unités
    (3, 11, 10),  -- Basilic, 10 feuilles
    (3, 12, 150), -- Mozzarella, 150g
    -- Pour Stir-Fry Asiatique (recipe_id = 4)
    (4, 1, 300),  -- Poulet, 300g
    (4, 10, 1),   -- Oignons, 1 unité
    (4, 9, 2);    -- Ail, 2 gousses

-- Inserer des étapes d'instructions (RecipeInstructions) - CORRIGÉ: supprimé quantity et unit qui n'existent pas dans le schéma
-- Pour la recette "Poulet Alfredo"
INSERT INTO RecipeInstructions (recipe_id, step_number, description, ingredient_id) VALUES
    (1, 1, 'Faites cuire les pâtes selon les instructions sur l''emballage.', 2),
    (1, 2, 'Faites cuire le poulet dans l''huile d''olive jusqu''à ce qu''il soit doré.', 1),
    (1, 3, 'Incorporez les tomates coupées en dés dans la poêle avec le poulet et faites mijoter pendant quelques minutes.', 3);

-- Pour la recette "Salade César"
INSERT INTO RecipeInstructions (recipe_id, step_number, description, ingredient_id) VALUES
    (2, 1, 'Lavez et coupez les feuilles de laitue dans un grand bol.', 5),
    (2, 2, 'Ajoutez la vinaigrette césar et mélangez bien.', 8),
    (2, 3, 'Servez avec des croûtons et du parmesan râpé.', 7);

-- Pour la recette "Pasta Végétarienne"
INSERT INTO RecipeInstructions (recipe_id, step_number, description, ingredient_id) VALUES
    (3, 1, 'Faites cuire les pâtes al dente selon les instructions.', 2),
    (3, 2, 'Coupez les tomates en dés et hachez le basilic.', 3),
    (3, 3, 'Mélangez les pâtes chaudes avec les tomates, basilic et mozzarella.', 12);

-- Pour la recette "Stir-Fry Asiatique"
INSERT INTO RecipeInstructions (recipe_id, step_number, description, ingredient_id) VALUES
    (4, 1, 'Coupez le poulet en lamelles et émincez l''oignon.', 1),
    (4, 2, 'Faites chauffer l''huile dans un wok et faites revenir l''ail.', 9),
    (4, 3, 'Ajoutez le poulet et l''oignon, faites sauter 5-7 minutes.', 10);