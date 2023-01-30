const express = require('express')
const morgan = require('morgan')
const cors  = require('cors')

const app = express()

app.use(express.json())

app.use(cors())

// Creating custom token 'data' which returns the request.data stringified objecto from
// the 'processData' middleware function
morgan.token('data', (request, response) => request.data)

const processData = (request, response, next) => {
    request.data = JSON.stringify(request.body)
    next()
}

// Using middleware function 'processData', which stringifies the request.body
app.use(processData)

// Using a custom format function which replicates the output of 
// the 'tiny' format, and adds request data with HTTP POST resquests
app.use(morgan((tokens, request, response) => {
    let customFormat = [
        tokens.method(request, response),
        tokens.url(request, response),
        tokens.status(request, response),
        tokens.res(request, response, 'content-length'), '-',
        tokens['response-time'](request, response), 'ms'
    ]

    // When the server receives a 'POST' request, the data of the request is added to the console log
    if (request.method === 'POST') {
        customFormat = customFormat.concat(tokens.data(request, response))
    }
    return customFormat.join(' ')
}))

let persons = [
    {
        "id": 1,
        "name": "Arto Hellas",
        "number": "040-123456"
    },
    {
        "id": 2,
        "name": "Ada Lovelace",
        "number": "39-44-5323523"
    },
    {
        "id": 3,
        "name": "Dan Abramov",
        "number": "12-43-234345"
    },
    {
        "id": 4,
        "name": "Mary Poppendieck",
        "number": "39-23-6423122"
    }
]

app.get('/api/persons', (request, response) => {
    response.json(persons)
})

app.get('/info', (request, response) => {
    const quantityPersons = persons.length
    const currentDate = new Date()

    const line1  = `<p>Phonebook has info for ${quantityPersons} people</p>`
    const line2 = `<p>${currentDate}</p>`

    const responseArray = [line1, line2]
    response.send(
        responseArray.join("\n")
    )
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)
    if(person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})


app.post('/api/persons', (request, response) => {
    const body = request.body

    if(!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }

    if(!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    const personExists = persons.find(person => person.name === body.name)

    if(personExists) {
        return response.status(400).json({
            error: 'Person already exists'
        })
    }

    const person = {
        name: body.name,
        number: body.number,
        id: generateId()
    }

    persons = persons.concat(person)

    response.json(person)
})

const generateId = () => {
    let idFound = false

    const maxNumber = 10000

    // This loop will become infinite if the number of persons 
    // reaches the maxNumber of persons value
    while(!idFound) {
        const id = Math.floor(Math.random()*maxNumber)
        const idExists = persons.find(person => person.id === id)

        if(!idExists) {
            idFound = true
            return id
        }
    }
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})