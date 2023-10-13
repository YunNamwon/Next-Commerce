import type { NextApiRequest, NextApiResponse } from 'next'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: 'secret_rGha74LtFRqOvlnKDc5DWfwZcjrVSKuJDFm2Z6PWd9A', // notion my integrations api key 
})

const databaseId = 'f0dc03d4a9c54c3fb4331d37a0931a75' //notion 주소 id  ? 전까지 

async function addItem(name: string) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
    })
    console.log(response)
  } catch (error) {
    console.error(JSON.stringify(error))
  }
}

type Data = {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { name } = req.query

  if (name == null) {
    return res.status(400).json({ message: 'No name' })
  }

  try {
    await addItem(String(name))
    res.status(200).json({ message: `Success ${name} added` })
  } catch (error) {
    res.status(400).json({ message: `Failed ${name} added` })
  }
}