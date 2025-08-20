"use client";

import { FiTrash2, FiX } from "react-icons/fi";

interface DeleteEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    entityType: "review" | "watchList" | "discussion";
}

export default function DeleteEntityModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    entityType
}: DeleteEntityModalProps) {
    if (!isOpen) return null;

    const getEntityTypeText = () => {
        switch (entityType) {
            case "review":
                return "review";
            case "watchList":
                return "watch list";
            case "discussion":
                return "discussion";
            default:
                return "item";
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        Delete {getEntityTypeText().charAt(0).toUpperCase() + getEntityTypeText().slice(1)}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="mb-6">
                    <p className="text-gray-300 mb-2">
                        Are you sure you want to delete this {getEntityTypeText()}?
                    </p>
                    <p className="text-gray-300 mt-2">
                        This action cannot be undone.
                    </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <FiTrash2 className="w-4 h-4" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
