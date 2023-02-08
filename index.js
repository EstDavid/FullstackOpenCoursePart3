require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors  = require('cors')
const Person = require('./models/person')

// Setting app express
const app = express()

app.use(express.json())

app.use(cors())

app.use(express.static('build'))

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
    Person.find({}).then(persons => {
        response.json(persons)
    })
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
    Person.findById(request.params.id).then(person => {
        response.json(person)
    })
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})


app.post('/api/persons', (request, response) => {
    const body = request.body
    console.log('posting', body)

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

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save()
        .then(savedPerson => {
            console.log('saving')
            response.json(savedPerson)
        })
        .catch(error => console.log('error'))
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})