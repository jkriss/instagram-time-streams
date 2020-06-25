const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { FileStore } = require('time-streams')

async function run() {
  const [input, streamName='instagram'] = process.argv.slice(2)
  if (!input) {
    console.error('First argument must be an Instagram media.json file')
    process.exit(1)
  }
  console.log("reading", input)
  const baseDir = path.dirname(input)
  const jsonString = fs.readFileSync(input, 'utf8')

  const media = JSON.parse(jsonString)

  const { photos, videos } = media
  console.log(`Importing ${photos.length} photos, ${videos.length} videos`)
  const stream = new FileStore(streamName)
  const metaStream = new FileStore(streamName+'-metadata')
  const allMedia = photos.concat(videos)
  for (const m of allMedia) {

    // handle the media
    const name = path.basename(m.path).split('.')[0]
    const date = new Date(m.taken_at)
    const mediaExt = path.extname(m.path)//.slice(1)
    const contentType = mime.getType(mediaExt)

    try {
      const mediaBody = fs.readFileSync(path.join(baseDir, m.path))
      const mediaId = await stream.save({ name, date, body: mediaBody, contentType, overwrite: true })

      // handle the metadat
      const body = {
        caption: m.caption,
        media: `../${streamName}/${mediaId}`
      }

      await metaStream.save({ name, date, body: JSON.stringify(body, null, 2), contentType: 'application/json', overwrite: true })
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`File ${err.path} doesn't exist`)
      } else {
        console.warn(err)        
      }
    }
  }
}

run()
