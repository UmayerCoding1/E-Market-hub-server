import multer from "multer";

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,'./public/upload')
    },

    filename: (req,file,cb) => {
     cb(null, `eMarketHub-${Date.now()}-${file.originalname}`)
    }
});

 const upload = multer({storage})

