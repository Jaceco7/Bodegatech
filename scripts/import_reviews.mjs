/** CSV: review_id,user_id,product_id,rating,comment. Node 20+, pg dependency already included. */
import {readFileSync,writeFileSync} from 'node:fs';
import pg from 'pg';
const filename=process.argv[2];
if(!filename||!process.env.DATABASE_URL){console.error('Uso: node --env-file=.env scripts/import_reviews.mjs 01_dataset/reviews.csv');process.exit(1)}
// RFC4180-compatible tokenizer, including quoted commas and newlines.
function parseCSV(s){const rows=[];let row=[],field='',quote=false;for(let i=0;i<s.length;i++){const c=s[i];if(quote){if(c==='"'&&s[i+1]==='"'){field+='"';i++}else if(c==='"')quote=false;else field+=c;}else if(c==='"')quote=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=c;}if(quote)throw Error('CSV con comillas incompletas');if(row.length||field){row.push(field);rows.push(row)}return rows}
const [head,...rows]=parseCSV(readFileSync(filename,'utf8').replace(/^\uFEFF/,''));
const required=['review_id','user_id','product_id','rating','comment'];
if(!head||required.some((name,i)=>head[i]!==name))throw Error(`Encabezados requeridos: ${required.join(',')}`);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
let accepted=0,rejected=0,duplicates=0;const errors=[];
try{const client=await pool.connect();try{for(let i=0;i<rows.length;i++){const r=rows[i];const [id,userId,productId,ratingText,comment]=r;let reason='';const rating=Number(ratingText);
if(r.length!==5||!id||!userId||!productId||!Number.isInteger(rating)||rating<0||rating>5||comment.length>1000)reason='Campos incompletos, rating fuera de 0–5 o comentario demasiado largo';
if(!reason){try{const result=await client.query('INSERT INTO reviews (id, "userId", "productId", rating, comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING RETURNING id',[id,userId,productId,rating,comment||null]);if(result.rowCount)accepted++;else duplicates++;}catch(e){reason=`Base de datos: ${e.constraint||e.code||'error'}`;}}
if(reason){rejected++;errors.push({line:i+2,review_id:id||'',reason});}
}}finally{client.release()}}finally{await pool.end()}
const report={input:rows.length,accepted,rejected,duplicates,errors};
writeFileSync('03_informe/importacion_resultado.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
