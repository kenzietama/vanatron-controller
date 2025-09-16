const displayItem = require('../models/displayItem');
const {io} = require('../lib/socket');
const Parameter = require("../models/parameter");
const mongoose = require("mongoose")

const addDisplayItem = async (req, res) => {
    const {sensor, device, parameter} = req.body
    try {
        const exist = await displayItem.findOne({sensor: sensor, device: device, parameter: parameter})
        if (exist) {
            return res.status(409).json({error: "Item already exist!"})
        }

        const response = await displayItem.create(req.body)
        res.status(201).json(response)
    } catch (error) {
        console.error("Error saving display item:", error);
        res.status(500).json({error: error.message})
    }
}

const getDisplayItems = async (req, res) => {
    try {
        const displayItems = await displayItem.find({})
        res.status(200).json(displayItems)
    } catch (error) {
        console.error("Error fetching display items:", error);
        res.status(500).json({error: error.message})
    }
}

const getDisplayItem = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await displayItem.findById(id);
        res.json(response);
    } catch (error) {
        console.error("Error fetching display item:", error);
        res.status(500).json({ message: "Error fetching display item" });
    }
};

const updateDisplayItem = async (req, res) => {
    try {
        const { id } = req.params
        const { sensor, device, parameter, displayName, unit, maxValue, minValue  } = req.body;
        const response = await displayItem.findByIdAndUpdate(id, {sensor, device, parameter, displayName, unit, maxValue, minValue}, {new: true, runValidators: true})

        if(!response) {
            return res.status(404).send({message: 'Display item not found'})
        }

        res.status(200).json(response)
    } catch (error) {
        console.error("Error updating display item: ", error)
        res.status(500).json({message: "Error updating display item"})
    }
}

const deleteDisplayItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDisplayItem = await displayItem.findByIdAndDelete(id);

        if (!deletedDisplayItem) {
            return res.status(404).json({ message: "Display item not found." });
        }

        res.json({ message: "Display item successfully deleted!" });
    } catch (error) {
        console.error("Error deleting display item:", error);
        res.status(500).json({ message: "Error deleting display item" });
    }
};

const getData = async (req, res) => {
    try {
        const response = await displayItem.find({});
        const results = [];

        for (const item of response) {
            const { sensor, device, parameter } = item;

            try {
                const projection = {}
                projection[parameter] = 1

                const collection = mongoose.connection.db.collection(sensor);
                const latestData = await collection
                    .find({deviceId: device})
                    .project(projection)
                    .sort({ createdAt: -1 })
                    .limit(1)
                    .toArray();

                if (latestData.length > 0) {
                    results.push(latestData[0]);
                }
            } catch (error) {
                console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
            }
        }

        res.status(200).json(results);
    } catch (error) {
        console.error("Error getting display data:", error)
        res.status(500).json({ message: "Error getting display data"})
    }
}

const getGraph = async (req, res) => {
    try {
        const response = await displayItem.find({});
        const results = [];

        for (const item of response) {
            const { sensor, device, parameter } = item;

            try {
                const collection = mongoose.connection.db.collection(sensor);

                // Query the collection and project the fields
                const latestData = await collection.find(
                    { deviceId: device },
                    {
                        // Project the parameter as 'value' and include 'createdAt'
                        projection: {
                            [parameter]: 1, // This will be renamed to 'value'
                            createdAt: 1
                        }
                    }
                ).sort({ createdAt: -1 }).limit(10).toArray();

                // Transform the latestData to keep the original structure
                const transformedData = latestData.map(dataItem => ({
                    value: dataItem[parameter], // Rename the field to 'value'
                    createdAt: dataItem.createdAt // Keep the createdAt field
                }));

                // Push the transformed data into results
                results.push(transformedData);
            } catch (error) {
                console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
            }
        }

        // Send the results back to the client
        res.status(200).json(results);
    } catch (error) {
        console.error("Error getting graph data:", error);
        res.status(500).json({ message: "Error getting graph data" });
    }
};

const getLatestData = async (req, res) => {
    try {
        const response = await displayItem.find({})
        const results = []

        for (const item of response) {
            const { sensor, device, parameter } = item;

            try {
                const collection = mongoose.connection.db.collection(sensor);

                const latestData = await collection.find(
                    { deviceId: device },
                    {
                        projection: {
                            [parameter]: 1
                        }
                    }
                ).sort({ createdAt: -1 }).limit(1).toArray();

                const transformedData = latestData.map(dataItem => ({
                    value: dataItem[parameter]
                }));

                results.push({
                    ...item.toObject(), // Convert Mongoose document to plain object
                    value: transformedData.length > 0 ? transformedData[0].value : null // Add latest value
                });
            } catch (error) {
                console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
            }
        }

        res.status(200).json(results)
    } catch (error) {
        console.error("Error fetching display items:", error);
        res.status(500).json({error: error.message})
    }
}



module.exports = {
    addDisplayItem,
    getDisplayItems,
    getDisplayItem,
    deleteDisplayItem,
    updateDisplayItem,
    getData,
    getGraph,
    getLatestData
}
