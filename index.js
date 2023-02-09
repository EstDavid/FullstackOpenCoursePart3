require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors  = require('cors')
const Person = require('./models/person')

// Setting app express
const app = express()
app.use(express.static('build'))
app.use(express.json())
app.use(cors())

// Creating custom token 'data' which returns the request.data stringified object from
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

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get("/info", (request, response, next) => {
    Person.find({}).then((people) => {
        const quantityPersons = people.length
        const currentDate = new Date()

        const line1 = `<p>Phonebook has info for ${quantityPersons} people</p>`
        const line2 = `<p>${currentDate}</p>`

        const responseArray = [line1, line2]
        response.send(responseArray.join("\n"))
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})


app.post("/api/persons", (request, response, next) => {
    const { name, number } = request.body

    if (!name) {
        return response.status(400).json({
            error: "name missing",
        })
    }

    if (!number) {
        return response.status(400).json({
            error: "number missing",
        })
    }

    const person = new Person({
        name: name,
        number: number,
    })

    person.save()
        .then((savedPerson) => {
            response.json(savedPerson)
        })
        .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body
    Person.findByIdAndUpdate(
        request.params.id,
        { name, number },
        { new: true, runValidators: true, context: 'query' })
    .then((updatedPerson) => {
        response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: "unknown error" })
}

app.use(unknownEndpoint)

// Defining error handler
const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error:error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})