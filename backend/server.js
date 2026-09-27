const express = require('express')
const { auth, admin } = require('./firebase/initializeFirebase')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const fs = require('fs')
const Business = require('./models/Business')
const routes = require('./routes/itemRoutes')
const setupSwagger = require('./swagger')
const config = require('./config')
const logger = require('./utils/logger')
require('./OTP/RedisConfig/redis.setup')


const apiRoutes = require('./routes/index')

const app = express()
app.use(cors({
  origin: true, // Allow any origin in dev (or specify front-end URL)
  credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.get('/api/ping', (req, res) => res.json({ pong: true }))

app.use('/api', apiRoutes)

setupSwagger(app)

// --- Serve Static Frontend with Dynamic OG Tags in Production ---
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.resolve(__dirname, '../frontend/dist');
  
  // Intercept specific routes that need dynamic meta tags
  app.get('/shop/:slug', async (req, res, next) => {
    try {
      const store = await Business.findOne({ slug: req.params.slug });
      
      const indexPath = path.join(distPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return next();
      }
      
      let html = fs.readFileSync(indexPath, 'utf8');
      
      if (store) {
        // Fetch a product image to use as the preview thumbnail
        const Product = require('./models/Product');
        const firstProduct = await Product.findOne({ 
          business_id: store._id, 
          image_url: { $ne: null, $ne: "", $exists: true } 
        });
        
        let imageUrl = firstProduct ? firstProduct.image_url : 'https://simbbiz.com/favicon.svg'; // Fallback
        
        // If it's a cloudinary URL, transform it so WhatsApp accepts it (under 300kb, 600x600)
        if (imageUrl.includes('res.cloudinary.com')) {
           imageUrl = imageUrl.replace('/upload/', '/upload/c_fill,w_600,h_600,q_80/');
        }

        html = html.replace('<title>SIMBBiz</title>', `<title>${store.name} - SIMBBiz</title>`);
        html = html.replace('<!-- OG_TAGS -->', `
    <meta property="og:title" content="🛍️ ${store.name} | SIMBBiz Store" />
    <meta property="og:description" content="✨ ${store.description || 'Welcome to my store!'} 👉 Click here to explore our exclusive catalog and order on WhatsApp today!" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="🛍️ ${store.name} | SIMBBiz Store">
    <meta name="twitter:description" content="✨ ${store.description || 'Welcome to my store!'} 👉 Click here to explore our exclusive catalog and order on WhatsApp today!">
    <meta name="twitter:image" content="${imageUrl}">
        `);
      }
      res.send(html);
    } catch (err) {
      logger.error('Error serving dynamic OG tags', err.message);
      next(err);
    }
  });

  // Serve static assets
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('Mongo connection error', err.message))

const PORT = config.PORT
app.listen(PORT, () => logger.info(`Backend listening on ${PORT}`))
