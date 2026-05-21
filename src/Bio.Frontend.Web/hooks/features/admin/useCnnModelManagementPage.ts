import { useState, useMemo, useCallback } from "react";
import {
    useActiveModelMetrics,
    useAiHardwareStatus,
    useAiModelVersions,
    useRecentTrainingJobs,
    useStartFineTuning,
    useUploadManualModel,
    useNewObservationsSummary,
} from "@/hooks/features/admin/useAiModelManagement";
import type { CnnModelVersion } from "@/types";

export function useCnnModelManagementPage() {
    // ─── React Query Hooks ────────────────────────────────────────────────────
    const hardwareQuery = useAiHardwareStatus();
    const versionsQuery = useAiModelVersions();
    const activeMetricsQuery = useActiveModelMetrics();
    const recentJobsQuery = useRecentTrainingJobs(10);
    const observationsSummaryQuery = useNewObservationsSummary();

    const startTuningMutation = useStartFineTuning();
    const uploadManualMutation = useUploadManualModel();

    // ─── Local Dialog/Sheet States ────────────────────────────────────────────
    const [isAutoOpen, setIsAutoOpen] = useState<boolean>(false);
    const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
    const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);

    // ─── Checkpoint Guard Modal State ─────────────────────────────────────────
    const [isValidationOpen, setIsValidationOpen] = useState<boolean>(false);
    const [selectedModel, setSelectedModel] = useState<CnnModelVersion | null>(null);

    // ─── AdminDataTable Control States ────────────────────────────────────────
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [sortBy, setSortBy] = useState<string>("deployedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // ─── Helpers & Memoized Derivations ───────────────────────────────────────
    const activeJob = useMemo(() => {
        return recentJobsQuery.data?.find(
            (j) => j.status === "Running" || j.status === "Pending"
        );
    }, [recentJobsQuery.data]);

    const activeModel = useMemo(() => {
        return versionsQuery.data?.find((v) => v.isActive);
    }, [versionsQuery.data]);

    // Handle column sorting
    const handleSort = useCallback((key: string) => {
        setSortBy((prev) => {
            if (prev === key) {
                setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
                return prev;
            }
            setSortOrder("desc");
            return key;
        });
        setPage(1); // Reset page to 1 on sort change
    }, []);

    // Filter, sort, and process registered model versions
    const filteredVersions = useMemo(() => {
        let list = [...(versionsQuery.data || [])];

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (v) =>
                    v.modelName.toLowerCase().includes(q) ||
                    v.version.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            let valA = (a as Record<string, any>)[sortBy];
            let valB = (b as Record<string, any>)[sortBy];

            if (sortBy === "deployedAt") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;

            if (typeof valA === "string") {
                return sortOrder === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortOrder === "asc" ? valA - valB : valB - valA;
        });

        return list;
    }, [versionsQuery.data, search, sortBy, sortOrder]);

    const refetchAll = useCallback(async () => {
        await Promise.all([
            hardwareQuery.refetch(),
            versionsQuery.refetch(),
            activeMetricsQuery.refetch(),
            recentJobsQuery.refetch(),
            observationsSummaryQuery.refetch(),
        ]);
    }, [
        hardwareQuery,
        versionsQuery,
        activeMetricsQuery,
        recentJobsQuery,
        observationsSummaryQuery,
    ]);

    const totalPages = Math.ceil(filteredVersions.length / 10);
    const paginatedVersions = useMemo(() => {
        const start = (page - 1) * 10;
        return filteredVersions.slice(start, start + 10);
    }, [filteredVersions, page]);

    return {
        refetchAll,
        // Queries
        hardware: hardwareQuery.data,
        isHardwareLoading: hardwareQuery.isLoading,
        isHardwareError: hardwareQuery.isError,

        versions: paginatedVersions,
        allVersionsCount: filteredVersions.length,
        isVersionsLoading: versionsQuery.isLoading,
        refetchVersions: versionsQuery.refetch,

        activeMetrics: activeMetricsQuery.data,
        isActiveMetricsLoading: activeMetricsQuery.isLoading,

        observationsSummary: observationsSummaryQuery.data,
        isObservationsSummaryLoading: observationsSummaryQuery.isLoading,

        recentJobs: recentJobsQuery.data,
        isJobsLoading: recentJobsQuery.isLoading,
        refetchJobs: recentJobsQuery.refetch,
        isJobsFetching: recentJobsQuery.isFetching,

        // Mutations
        startTuningMutation,
        uploadManualMutation,

        // Context
        activeJob,
        activeModel,

        // Dialog state controllers
        isAutoOpen,
        setIsAutoOpen,
        isManualOpen,
        setIsManualOpen,
        isMetricsOpen,
        setIsMetricsOpen,

        isValidationOpen,
        setIsValidationOpen,
        selectedModel,
        setSelectedModel,

        // Table controllers
        search,
        setSearch,
        page,
        setPage,
        sortBy,
        sortOrder,
        handleSort,
        totalPages,
    };
}
