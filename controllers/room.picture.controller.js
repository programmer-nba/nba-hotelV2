const {Room} = require('../models/room.schema');
const multer = require("multer");
const {uploadFileCreate,deleteFile} = require('../functions/uploadfilecreate');

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
     //console.log(file.originalname);
  },
});

module.exports.Create = async (req, res) => {
    console.log(req.body);
    const id = req.params.roomId;

    console.log('id',id);

    try {

    const room = await Room.findById(id);
    if(!room){
      return res.status(404).send(`Room id ${id} not found`);
    }
    
    let upload = multer({ storage: storage }).array("imgCollection", 20);
    upload(req, res, async function (err) {
      console.log(req);
      const reqFiles = [];
      const result=[];

      if(err){
        return res.status(500).send(err);
      }

      if (!req.files) {
        res.status(500).send({ message: "มีบางอย่างผิดพลาด", status: false });
      } else {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
        const src =  await uploadFileCreate(req.files, res, { i, reqFiles });
            result.push(src);
        
          //   reqFiles.push(url + "/public/" + req.files[i].filename);

        }

        if(result){

            const data = room.imageURl.concat(reqFiles);

            Room.findByIdAndUpdate(id,{imageURl:data},{returnOriginal:false},(err,result)=>{
                if(err){
                    return res.status(500).send({ message:err});
                }
           
            })
        }

        res.status(201).send({
          message: "สร้างรูปภาพเสร็จเเล้ว",
          status: true,
          file: reqFiles,
          result:result
        });
      }
    });
  } catch (error) {
    res.status(500).send({ message: "มีบางอย่างผิดพลาด", status: false });
  }
};

//delete
module.exports.Delete = async (req,res) =>{

  const roomid = req.params.roomId;
  const pictureid = req.params.pictureid;

  try {

    const room = await Room.findById(roomid);

    if(!room){
      return res.status(404).send(`Room ${roomid} not found`);
    }

    await deleteFile(pictureid);

    const updatedata = room.imageURl.filter(image => image !== pictureid);

    Room.findByIdAndUpdate(roomid,{imageURl:updatedata},{returnOriginal:false},(err,room)=>{
      if(err){
        return res.status(500).send(err);
      }
      return res.status(200).send(room.imageURl);
    })

  } catch (error) {
    return res.status(500).send(error);
  }
  
}

