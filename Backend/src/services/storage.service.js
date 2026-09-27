import imagekit from "@imagekit/nodejs"

async function uploadImage(file) {
    try{
        const client = new imagekit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY})
        const response = await client.files.upload({
            file: file.buffer.toString("base64"),
            fileName: file.originalname,
            folder:"QueueLess"
        })
        return response.url;
    }

    catch(error){
        console.error(error);
        throw new Error("Image upload failed, try again later!");
    }
}

export { uploadImage };