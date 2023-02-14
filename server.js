const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
app.use(require('method-override')('_method'));
app.use(express.urlencoded({ extended: false }));

const Sequelize = require('sequelize');
const conn = new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost/acme_people_places_things');

const Person = conn.define('person', {
    name: {
        type: Sequelize.STRING
    }
});

const Place = conn.define('place', {
    name: {
        type: Sequelize.STRING
    }
});

const Thing = conn.define('thing',{
    name: {
        type: Sequelize.STRING
    }
});

const Souvenir = conn.define('souvenir',{});

Souvenir.belongsTo(Person);
Souvenir.belongsTo(Place);
Souvenir.belongsTo(Thing);

const syncAndSeed = async() => {
    await conn.sync({force: true});
    const [johnny, jeff, jill, joy] = await Promise.all([
        Person.create({name: 'Johnny'}),
        Person.create({name: 'Jeff'}),
        Person.create({name: 'Jill'}),
        Person.create({name: 'Joy'})
    ]);
    const [paris, dublin, zurich, dubai] = await Promise.all([
        Place.create({name: 'Paris'}),
        Place.create({name: 'Dublin'}),
        Place.create({name: 'Zurich'}),
        Place.create({name: 'Dubai'})
    ])
    const [hat, ring, vest, experiences] = await Promise.all([
        Thing.create({name: 'hat'}),
        Thing.create({name: 'ring'}),
        Thing.create({name: 'vest'}),
        Thing.create({name: 'guitar'})
    ])
    await Promise.all([
        Souvenir.create({
            personId:  johnny.id,
            placeId: paris.id,
            thingId: hat.id
        }),
        Souvenir.create({
            personId: joy.id,
            placeId: dubai.id,
            thingId: experiences.id
        })
    ])
};

app.get('/', async(req, res, next) => {
    try{
    const people = await Person.findAll({});
    const places = await Place.findAll({});
    const things = await Thing.findAll({});
    const souvenirs = await Souvenir.findAll({
        include: [Person, Place, Thing]
    });
        res.send(`
            <html>
                <head>
                </head>
                <body>
                    <h1>Acme People, Places and Things</h1>
                    <div>
                        <h2>People</h2>
                        <ul>
                            ${
                                people.map(person => {
                                    return `
                                        <li>
                                            ${person.name}
                                        </li>
                                    `;
                                }).join('')
                            }
                        </ul>
                    </div>
                    <div>
                        <h2>Places</h2>
                        <ul>
                            ${
                                places.map(place => {
                                    return `
                                        <li>
                                            ${place.name}
                                        </li>
                                    `;
                                }).join('')
                            }
                        </ul>
                    </div>
                    <div>
                        <h2>Things</h2>
                        <ul>
                            ${
                                things.map(thing => {
                                    return `
                                        <li>
                                            ${thing.name}
                                        </li>
                                    `;
                                }).join('')
                            }
                        </ul>
                    </div>
                    <div>
                        <h2>Souvenir Purchases</h2>
                        <div>Create a new Souvenir purchase by selecting a Person, the Place they purchased the Souvenir, and the Thing they bought</div>
                        <form method='POST'>
                            <span>Person</span>
                            <select name='personId'>
                                ${
                                    people.map(person => {
                                        return `
                                            <option value=${person.id}>
                                                ${person.name}
                                            </option>
                                        `;
                                    }).join('')
                                }
                            </select>
                            <span>Place</span>
                            <select name='placeId'>
                                ${
                                    places.map(place => {
                                        return `
                                            <option value=${place.id}>
                                                ${place.name}
                                            </option>
                                        `;
                                    }).join('')
                                }
                            </select>
                            <span>Thing</span>
                            <select name='thingId'>
                                ${
                                    things.map(thing => {
                                        return `
                                            <option value=${thing.id}>
                                                ${thing.name}
                                            </option>
                                        `
                                    }).join('')
                                }
                            </select>
                            <button>Create</button>
                        </form>
                        <ul>
                            ${
                                souvenirs.map(souvenir => {
                                    return `
                                        <li>
                                            <span>
                                                ${souvenir.person.name} purchased a ${souvenir.thing.name} in ${souvenir.place.name}
                                                <form method='POST' action='/${souvenir.id}?_method=delete'>
                                                    <button>Delete</button>
                                                </form>
                                            </span>
                                        </li>
                                    `
                                }).join('')
                            }
                        </ul>
                    </div>
                </body>
            </html>
        `);
    }
    catch(err){
        next(err);
    }
});

app.post('/', async(req, res, next) => {
    try{
        const souvenir = await Souvenir.create(req.body);
        res.redirect('/');
    }
    catch(err){
        next(err);
    }
});

app.delete('/:id', async(req, res, next) => {
    try{
        const souvenir = await Souvenir.findByPk(req.params.id);
        await souvenir.destroy();
        res.redirect('/');
    }
    catch(err){
        next(err);
    }
});
  

app.listen(port, async() => {
    await syncAndSeed();
    console.log(`I am listening on port ${port}`);
})