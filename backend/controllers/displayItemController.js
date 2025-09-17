const displayItem = require('../models/displayItem');
const {io} = require('../lib/socket');
const Parameter = require("../models/parameter");
const mongoose = require("mongoose")

const addDisplayItem = async (req, res) => {
    const {sensor, device, parameter, displayName} = req.body
    try {
        const exist = await displayItem.findOne({sensor: sensor, device: device, parameter: parameter})
        if (exist) {
            return res.status(409).json({error: "Item already exist!"})
        }

        const duplicate = await displayItem.findOne({displayName: displayName})
        if (duplicate) {
            return res.status(409).json({error: "Display name already exist!"})
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

// const getGraph = async (req, res) => {
//     try {
//         const response = await displayItem.find({});
//         const results = [];
//
//         for (const item of response) {
//             const { sensor, device, parameter, displayName } = item;
//
//             try {
//                 const collection = mongoose.connection.db.collection(sensor);
//
//                 // Query the collection and project the fields
//                 const latestData = await collection.find(
//                     { deviceId: device },
//                     {
//                         // Project the parameter as 'value' and include 'createdAt'
//                         projection: {
//                             [parameter]: 1, // This will be renamed to 'value'
//                             createdAt: 1
//                         }
//                     }
//                 ).sort({ createdAt: -1 }).limit(10).toArray();
//
//                 // Transform the latestData to keep the original structure
//                 const transformedData = latestData.map(dataItem => ({
//                     displayName: displayName,
//                     value: dataItem[parameter], // Rename the field to 'value'
//                     createdAt: dataItem.createdAt // Keep the createdAt field
//                 }));
//
//                 // Push the transformed data into results
//                 results.push(transformedData);
//             } catch (error) {
//                 console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
//             }
//         }
//
//         // Send the results back to the client
//         res.status(200).json(results);
//     } catch (error) {
//         console.error("Error getting graph data:", error);
//         res.status(500).json({ message: "Error getting graph data" });
//     }
// };

// const getGraph = async (req, res) => {
//     try {
//         const response = await displayItem.find({});
//         const results = [];
//
//         for (const item of response) {
//             const { sensor, device, parameter, displayName } = item;
//
//             try {
//                 const collection = mongoose.connection.db.collection(sensor);
//
//                 // Get the latest data point first
//                 const latestDataPoint = await collection.findOne(
//                     {
//                         deviceId: device,
//                         createdAt: { $exists: true, $ne: null }
//                     },
//                     {
//                         projection: { createdAt: 1 },
//                         sort: { createdAt: -1 }
//                     }
//                 );
//
//                 if (!latestDataPoint) {
//                     console.warn(`No data with valid createdAt found for sensor: ${sensor}, device: ${device}`);
//                     results.push([]);
//                     continue;
//                 }
//
//                 const transformedData = [];
//                 let currentTime = latestDataPoint.createdAt;
//                 let intervalsBack = 0;
//
//                 // Try to get 10 data points, each 30 minutes apart
//                 while (transformedData.length < 10 && intervalsBack < 480) { // Max 480 intervals (10 days in 30-min intervals)
//                     // Change: 30 minutes = 30 * 60 * 1000 milliseconds
//                     const targetTime = new Date(currentTime.getTime() - (intervalsBack * 30 * 60 * 1000));
//                     const startTime = new Date(targetTime.getTime() - (15 * 60 * 1000)); // 15 minutes before
//                     const endTime = new Date(targetTime.getTime() + (15 * 60 * 1000));   // 15 minutes after
//
//                     const dataPoint = await collection.findOne(
//                         {
//                             deviceId: device,
//                             createdAt: {
//                                 $gte: startTime,
//                                 $lte: endTime,
//                                 $exists: true,
//                                 $ne: null
//                             }
//                         },
//                         {
//                             projection: {
//                                 [parameter]: 1,
//                                 createdAt: 1
//                             },
//                             sort: { createdAt: -1 }
//                         }
//                     );
//
//                     if (dataPoint && dataPoint[parameter] !== null && dataPoint[parameter] !== undefined) {
//                         transformedData.push({
//                             displayName: displayName,
//                             value: dataPoint[parameter],
//                             createdAt: dataPoint.createdAt
//                         });
//                     }
//
//                     intervalsBack++; // Move to the next 30-minute interval back
//                 }
//
//                 // If still not enough data points, fill with the oldest available data
//                 if (transformedData.length < 10) {
//                     const additionalDataNeeded = 10 - transformedData.length;
//
//                     const oldestFetchedTime = transformedData.length > 0
//                         ? new Date(Math.min(...transformedData.map(d => new Date(d.createdAt))))
//                         : currentTime;
//
//                     const additionalData = await collection.find(
//                         {
//                             deviceId: device,
//                             createdAt: {
//                                 $lt: oldestFetchedTime,
//                                 $exists: true,
//                                 $ne: null
//                             }
//                         },
//                         {
//                             projection: {
//                                 [parameter]: 1,
//                                 createdAt: 1
//                             }
//                         }
//                     ).sort({ createdAt: -1 }).limit(additionalDataNeeded).toArray();
//
//                     for (const dataPoint of additionalData) {
//                         if (dataPoint[parameter] !== null && dataPoint[parameter] !== undefined) {
//                             transformedData.push({
//                                 displayName: displayName,
//                                 value: dataPoint[parameter],
//                                 createdAt: dataPoint.createdAt
//                             });
//                         }
//                     }
//                 }
//
//                 transformedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//                 results.push(transformedData);
//             } catch (error) {
//                 console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
//                 results.push([]);
//             }
//         }
//
//         res.status(200).json(results);
//     } catch (error) {
//         console.error("Error getting graph data:", error);
//         res.status(500).json({ message: "Error getting graph data" });
//     }
// };

// const getGraph = async (req, res) => {
//     try {
//         const response = await displayItem.find({});
//         const results = [];
//
//         // Parse query params (allow decimals for interval/tolerance)
//         const intervalMinutes = Math.max(0.1, parseFloat(req.query.interval ?? '60')); // minimum 6 seconds
//         const points = Math.min(200, Math.max(1, parseInt(req.query.points ?? '10', 10)));
//         const toleranceMinutes = req.query.tolerance !== undefined
//             ? Math.max(0.1, parseFloat(req.query.tolerance))
//             : Math.max(0.1, intervalMinutes / 2);
//
//         const intervalMs = intervalMinutes * 60 * 1000;
//         const toleranceMs = toleranceMinutes * 60 * 1000;
//
//         for (const item of response) {
//             const { sensor, device, parameter, displayName } = item;
//
//             try {
//                 const collection = mongoose.connection.db.collection(sensor);
//
//                 // 1) Get the latest data point to anchor the series
//                 const latestDataPoint = await collection.findOne(
//                     {
//                         deviceId: device,
//                         createdAt: { $exists: true, $ne: null }
//                     },
//                     {
//                         projection: { [parameter]: 1, createdAt: 1 },
//                         sort: { createdAt: -1 }
//                     }
//                 );
//
//                 if (!latestDataPoint) {
//                     results.push([]);
//                     continue;
//                 }
//
//                 const picked = [];
//                 const pickedIds = new Set();
//
//                 // 2) Try to pick 'points' docs at the chosen interval
//                 for (let i = 0; i < points; i++) {
//                     const targetTime = new Date(latestDataPoint.createdAt.getTime() - (i * intervalMs));
//                     const startTime = new Date(targetTime.getTime() - toleranceMs);
//                     const endTime = new Date(targetTime.getTime() + toleranceMs);
//
//                     const doc = await collection.findOne(
//                         {
//                             deviceId: device,
//                             createdAt: { $gte: startTime, $lte: endTime, $exists: true, $ne: null },
//                             [parameter]: { $exists: true, $ne: null }
//                         },
//                         {
//                             projection: { [parameter]: 1, createdAt: 1 },
//                             sort: { createdAt: -1 } // latest within the window
//                         }
//                     );
//
//                     if (doc && !pickedIds.has(String(doc._id))) {
//                         pickedIds.add(String(doc._id));
//                         picked.push({
//                             displayName,
//                             value: doc[parameter],
//                             createdAt: doc.createdAt
//                         });
//                     }
//                 }
//
//                 // 3) If we still don't have enough, backfill with older docs (no interval guarantee)
//                 if (picked.length < points) {
//                     const needed = points - picked.length;
//                     const oldestPickedTime = picked.length > 0
//                         ? new Date(Math.min(...picked.map(d => new Date(d.createdAt).getTime())))
//                         : latestDataPoint.createdAt;
//
//                     const extras = await collection.find(
//                         {
//                             deviceId: device,
//                             createdAt: { $lt: oldestPickedTime, $exists: true, $ne: null },
//                             [parameter]: { $exists: true, $ne: null }
//                         },
//                         {
//                             projection: { [parameter]: 1, createdAt: 1 }
//                         }
//                     ).sort({ createdAt: -1 }).limit(needed * 3).toArray(); // small over-fetch to filter duplicates
//
//                     for (const ex of extras) {
//                         const id = String(ex._id);
//                         if (picked.length >= points) break;
//                         if (pickedIds.has(id)) continue;
//
//                         pickedIds.add(id);
//                         picked.push({
//                             displayName,
//                             value: ex[parameter],
//                             createdAt: ex.createdAt
//                         });
//                     }
//                 }
//
//                 // 4) Sort newest -> oldest to match existing frontend (x-axis reverse: true)
//                 picked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//
//                 results.push(picked);
//             } catch (error) {
//                 console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
//                 results.push([]);
//             }
//         }
//
//         res.status(200).json(results);
//     } catch (error) {
//         console.error("Error getting graph data:", error);
//         res.status(500).json({ message: "Error getting graph data" });
//     }
// };

const getGraph = async (req, res) => {
    try {
        const response = await displayItem.find({});
        const results = [];

        // Parse from route params
        const intervalMinutes = Math.max(0.1, parseFloat(req.params.interval ?? '60'));
        const points = 10;
        const toleranceMinutes = intervalMinutes >= 60 ? 2 : 1;

        const intervalMs = intervalMinutes * 60 * 1000;
        const toleranceMs = toleranceMinutes * 60 * 1000;

        for (const item of response) {
            const { sensor, device, parameter, displayName } = item;

            try {
                const collection = mongoose.connection.db.collection(sensor);

                // 1. Get the latest data point
                const latestDataPoint = await collection.findOne(
                    {
                        deviceId: device,
                        createdAt: { $exists: true, $ne: null }
                    },
                    {
                        projection: { [parameter]: 1, createdAt: 1 },
                        sort: { createdAt: -1 }
                    }
                );

                if (!latestDataPoint) {
                    results.push([]);
                    continue;
                }

                const picked = [];
                const pickedIds = new Set();

                // 2. Try to pick 'points' docs at the chosen interval
                for (let i = 0; i < points; i++) {
                    const targetTime = new Date(latestDataPoint.createdAt.getTime() - (i * intervalMs));
                    const startTime = new Date(targetTime.getTime() - toleranceMs);
                    const endTime = new Date(targetTime.getTime() + toleranceMs);

                    const doc = await collection.findOne(
                        {
                            deviceId: device,
                            createdAt: { $gte: startTime, $lte: endTime, $exists: true, $ne: null },
                            [parameter]: { $exists: true, $ne: null }
                        },
                        {
                            projection: { [parameter]: 1, createdAt: 1 },
                            sort: { createdAt: -1 }
                        }
                    );

                    if (doc && !pickedIds.has(String(doc._id))) {
                        pickedIds.add(String(doc._id));
                        picked.push({
                            displayName,
                            value: doc[parameter],
                            createdAt: doc.createdAt
                        });
                    }
                }

                // 3. If we still don't have enough, backfill with older docs (no interval guarantee)
                if (picked.length < points) {
                    const needed = points - picked.length;
                    const oldestPickedTime = picked.length > 0
                        ? new Date(Math.min(...picked.map(d => new Date(d.createdAt).getTime())))
                        : latestDataPoint.createdAt;

                    const extras = await collection.find(
                        {
                            deviceId: device,
                            createdAt: { $lt: oldestPickedTime, $exists: true, $ne: null },
                            [parameter]: { $exists: true, $ne: null }
                        },
                        {
                            projection: { [parameter]: 1, createdAt: 1 }
                        }
                    ).sort({ createdAt: -1 }).limit(needed * 3).toArray();

                    for (const ex of extras) {
                        const id = String(ex._id);
                        if (picked.length >= points) break;
                        if (pickedIds.has(id)) continue;

                        pickedIds.add(id);
                        picked.push({
                            displayName,
                            value: ex[parameter],
                            createdAt: ex.createdAt
                        });
                    }
                }

                picked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                results.push(picked);
            } catch (error) {
                console.error(`Error fetching data for sensor: ${sensor}, device: ${device}, parameter: ${parameter}`, error);
                results.push([]);
            }
        }

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
