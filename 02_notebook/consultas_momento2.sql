-- Consulta 2 corregida: el promedio viene de reviews, nunca de Product.
SELECT c.name AS categoria, p.name AS producto,
       ROUND(AVG(r.rating)::numeric,2) AS rating_promedio, COUNT(r.id) AS total_resenas
FROM "Product" p JOIN "Category" c ON c.id=p."categoryId"
LEFT JOIN reviews r ON r."productId"=p.id
WHERE c.id=$1 GROUP BY c.name,p.id,p.name ORDER BY p.name;
-- Consulta 3 (índice reviews_product_id_idx):
SELECT * FROM reviews WHERE "productId"=$1;
-- Regla de rechazo: pruebe con ids válidos dentro de una transacción de prueba.
-- BEGIN; INSERT INTO reviews(id,"userId","productId",rating) VALUES ('test-check', 'ID_USUARIO','ID_PRODUCTO',-1); ROLLBACK;
-- Rating 6 también debe fallar con reviews_rating_range_check.
