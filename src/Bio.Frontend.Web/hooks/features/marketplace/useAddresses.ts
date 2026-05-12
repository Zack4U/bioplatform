/**
 * useAddresses — user shipping address management hook.
 *
 * Manages the authenticated user's address book:
 *   - Fetches all addresses with React Query
 *   - Create / Update / Delete / SetDefault mutations with cache invalidation
 *   - Form open/close state + editing address tracking
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - AddressBook / AddressFormModal / AddressCard → UI ONLY
 *
 * @module hooks/features/marketplace/useAddresses
 */

"use client";

import {
  createAddress as createAddressService,
  deleteAddress as deleteAddressService,
  getAddresses,
  setDefaultAddress as setDefaultAddressService,
  updateAddress as updateAddressService,
} from "@/services/marketplace-service";
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ─── Context types ──────────────────────────────────────────────────────────

interface AddressMutationContext {
  previous: Address[] | undefined;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAddresses() {
  const queryClient = useQueryClient();

  // ── Form / editing state ───────────────────────────────────────────────

  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // ── Open form helpers ──────────────────────────────────────────────────

  const openCreateForm = useCallback(() => {
    setEditingAddress(null);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((address: Address) => {
    setEditingAddress(address);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    // Clear editing state after a short delay so the modal exit animation
    // can complete before the form fields reset
    setTimeout(() => setEditingAddress(null), 300);
  }, []);

  // ── Addresses query ────────────────────────────────────────────────────

  const {
    data: addresses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });

  // ── Shared cache invalidation ──────────────────────────────────────────

  const invalidateAddresses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
  }, [queryClient]);

  // ── Create address ─────────────────────────────────────────────────────

  const { mutate: createAddress, isPending: isCreating } = useMutation<
    Address,
    Error,
    CreateAddressRequest
  >({
    mutationFn: (data) => createAddressService(data),
    onSuccess: (created) => {
      invalidateAddresses();
      closeForm();
      toast.success(`Direccion "${created.addressType}" guardada exitosamente.`);
    },
    onError: () => {
      toast.error(
        "No se pudo guardar la direccion. Verifica los datos e intenta de nuevo.",
      );
    },
  });

  // ── Update address ─────────────────────────────────────────────────────

  const { mutate: updateAddress, isPending: isUpdating } = useMutation<
    Address,
    Error,
    { id: string; data: UpdateAddressRequest }
  >({
    mutationFn: ({ id, data }) => updateAddressService(id, data),
    onSuccess: (updated) => {
      // Optimistically patch the cache before the invalidation refetch
      queryClient.setQueryData<Address[]>(["addresses"], (old) => {
        if (!old) return old;
        return old.map((a) => (a.id === updated.id ? updated : a));
      });
      invalidateAddresses();
      closeForm();
      toast.success(`Direccion "${updated.addressType}" actualizada exitosamente.`);
    },
    onError: () => {
      toast.error("No se pudo actualizar la direccion. Intenta de nuevo.");
    },
  });

  // ── Delete address ─────────────────────────────────────────────────────

  const { mutate: deleteAddress, isPending: isDeleting } = useMutation<
    void,
    Error,
    string,
    AddressMutationContext
  >({
    mutationFn: (id) => deleteAddressService(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["addresses"] });

      const previous = queryClient.getQueryData<Address[]>(["addresses"]);

      // Optimistically remove from list
      queryClient.setQueryData<Address[]>(["addresses"], (old) =>
        old ? old.filter((a) => a.id !== id) : [],
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["addresses"], context.previous);
      }
      toast.error("No se pudo eliminar la direccion. Intenta de nuevo.");
    },
    onSuccess: () => {
      invalidateAddresses();
      toast.success("Direccion eliminada exitosamente.");
    },
  });

  // ── Set default address ────────────────────────────────────────────────

  const { mutate: setDefaultAddress, isPending: isSettingDefault } =
    useMutation<Address, Error, string, AddressMutationContext>({
      mutationFn: (id) => setDefaultAddressService(id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ["addresses"] });

        const previous = queryClient.getQueryData<Address[]>(["addresses"]);

        // Optimistically toggle isDefault flags
        queryClient.setQueryData<Address[]>(["addresses"], (old) => {
          if (!old) return old;
          return old.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }));
        });

        return { previous };
      },
      onError: (_err, _id, context) => {
        if (context?.previous) {
          queryClient.setQueryData(["addresses"], context.previous);
        }
        toast.error(
          "No se pudo establecer la direccion predeterminada. Intenta de nuevo.",
        );
      },
      onSuccess: (updated) => {
        // Sync the server value into the cache
        queryClient.setQueryData<Address[]>(["addresses"], (old) => {
          if (!old) return old;
          return old.map((a) =>
            a.id === updated.id ? updated : { ...a, isDefault: false },
          );
        });
        invalidateAddresses();
        toast.success(
          `"${updated.addressType}" establecida como direccion predeterminada.`,
        );
      },
    });

  // ── Derived state ──────────────────────────────────────────────────────

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  // ── Public API ─────────────────────────────────────────────────────────

  return {
    // Data
    addresses,
    defaultAddress,
    isLoading,
    isError,
    error,
    refetch,

    // CRUD mutations
    createAddress,
    isCreating,
    updateAddress,
    isUpdating,
    deleteAddress,
    isDeleting,
    setDefaultAddress,
    isSettingDefault,

    // Form state
    formOpen,
    setFormOpen,
    editingAddress,
    setEditingAddress,

    // Helpers
    openCreateForm,
    openEditForm,
    closeForm,
  };
}
