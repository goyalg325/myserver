import express from 'express'
import 'dotenv/config'
const app = express()
const PORT = process.env.PORT || 3001

// middlewares
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.get('/',(req,res) => {
    return res.send('working')
})
// import routes 
import ApiRoutes from './routes/api.js'
app.use('/api',ApiRoutes)

app.listen(PORT, () => console.log(`server started on port ${PORT}` ))