const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();
router.post("/", auth, async (req, res) => {
    try {
        if (!["Admin", "Manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not allowed" });
        }
        const task = await Task.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json(task);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get("/", auth, async (req, res) => {
    try {
        const filter = req.user.role === "Admin"
            ? {}
            : req.user.role === "Manager"
                ? { createdBy: req.user.id }
                : { assignedTo: req.user.id };

        const tasks = await Task.find(filter)
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        res.json(tasks);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.put("/:id", auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isManager = ["Admin", "Manager"].includes(req.user.role);
        const isAssignedUser = task.assignedTo?.toString() === req.user.id;

        if (!isManager && !isAssignedUser) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const updates = isManager
            ? req.body
            : { status: req.body.status };

        const updated = await Task.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (
            !["Admin", "Manager"].includes(req.user.role) ||
            (req.user.role === "Manager" &&
             task.createdBy.toString() !== req.user.id)
        ) {
            return res.status(403).json({ message: "Not allowed" });
        }

        await task.deleteOne();

        res.json({ message: "Task deleted" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;