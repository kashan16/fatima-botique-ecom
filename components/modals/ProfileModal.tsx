'use client';

import { useProfile } from '@/hooks/useProfile';
import { AddressType, CreateAddressInput } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddresses } from '@/hooks/useAddress';
import {
    AlertCircle,
    Check,
    Edit2,
    Home,
    Loader2,
    MapPin,
    Phone,
    Plus,
    Trash2,
    User,
    X,
} from 'lucide-react';
import Image from 'next/image';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const {
    profile,
    mergedProfile,
    isLoading: profileLoading,
    updateProfile,
    validateProfileData,
  } = useProfile();

  const {
    addresses,
    isLoading: addressesLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    validateAddress,
  } = useAddresses();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: profile?.username || '',
    phone_number: profile?.phone_number || '',
  });

  // Address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressInput>({
    full_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    address_type: 'both',
    is_default: false,
  });

  if (!isOpen) return null;

  const handleProfileUpdate = async () => {
    const validation = validateProfileData(profileForm);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const success = await updateProfile(profileForm);
    if (success) {
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleAddressSubmit = async () => {
    const validation = validateAddress(addressForm);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    let success = false;
    if (editingAddressId) {
      success = await updateAddress(editingAddressId, addressForm);
      if (success) {
        toast.success('Address updated successfully!');
      }
    } else {
      const newAddress = await createAddress(addressForm);
      success = !!newAddress;
      if (success) {
        toast.success('Address added successfully!');
      }
    }

    if (success) {
      setIsAddingAddress(false);
      setEditingAddressId(null);
      resetAddressForm();
    }
  };

  const handleEditAddress = (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setAddressForm({
        full_name: address.full_name,
        phone_number: address.phone_number,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        address_type: address.address_type,
        is_default: address.is_default,
      });
      setEditingAddressId(addressId);
      setIsAddingAddress(true);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const success = await deleteAddress(addressId);
      if (success) {
        toast.success('Address deleted successfully!');
      } else {
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    const success = await setDefaultAddress(addressId);
    if (success) {
      toast.success('Default address updated!');
    } else {
      toast.error('Failed to set default address');
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '',
      phone_number: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      address_type: 'both',
      is_default: false,
    });
  };

  const cancelAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    resetAddressForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold text-gray-900 font-sans">
              My Profile
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="profile" className="font-sans">
                <User className="w-4 h-4 mr-2" />
                Profile Info
              </TabsTrigger>
              <TabsTrigger value="addresses" className="font-sans">
                <MapPin className="w-4 h-4 mr-2" />
                Addresses ({addresses.length})
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
                </div>
              ) : (
                <>
                  {/* Profile Picture & Basic Info */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {mergedProfile?.profile_image_url ? (
                        <Image
                          width={32}
                          height={32}
                          src={mergedProfile.profile_image_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 font-sans">
                        {mergedProfile?.full_name || 'User'}
                      </h3>
                      <p className="text-gray-600">{mergedProfile?.email}</p>
                      {!mergedProfile?.has_complete_profile && (
                        <Badge className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Profile Incomplete
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Editable Profile Fields */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 font-sans">
                        Account Details
                      </h4>
                      {!isEditingProfile ? (
                        <Button
                          onClick={() => {
                            setProfileForm({
                              username: profile?.username || '',
                              phone_number: profile?.phone_number || '',
                            });
                            setIsEditingProfile(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleProfileUpdate}
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setIsEditingProfile(false)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username" className="text-gray-700">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={isEditingProfile ? profileForm.username : profile?.username || 'Not set'}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, username: e.target.value })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-gray-700">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={
                            isEditingProfile
                              ? profileForm.phone_number
                              : profile?.phone_number || 'Not set'
                          }
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone_number: e.target.value })
                          }
                          disabled={!isEditingProfile}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {mergedProfile?.missing_fields && mergedProfile.missing_fields.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-medium">
                          Please complete your profile by adding:{' '}
                          {mergedProfile.missing_fields.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              {addressesLoading && addresses.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
                </div>
              ) : (
                <>
                  {/* Add Address Button */}
                  {!isAddingAddress && (
                    <Button
                      onClick={() => setIsAddingAddress(true)}
                      className="w-full bg-gray-900 hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </Button>
                  )}

                  {/* Address Form */}
                  {isAddingAddress && (
                    <Card className="border-gray-300 bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg font-sans">
                          {editingAddressId ? 'Edit Address' : 'Add New Address'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                              id="full_name"
                              value={addressForm.full_name}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, full_name: e.target.value })
                              }
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              value={addressForm.phone_number}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, phone_number: e.target.value })
                              }
                              placeholder="9876543210"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address_line1">Address Line 1 *</Label>
                          <Input
                            id="address_line1"
                            value={addressForm.address_line1}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, address_line1: e.target.value })
                            }
                            placeholder="House No, Street Name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="address_line2">Address Line 2</Label>
                          <Input
                            id="address_line2"
                            value={addressForm.address_line2}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, address_line2: e.target.value })
                            }
                            placeholder="Landmark, Area"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, city: e.target.value })
                              }
                              placeholder="Mumbai"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State *</Label>
                            <Input
                              id="state"
                              value={addressForm.state}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, state: e.target.value })
                              }
                              placeholder="Maharashtra"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input
                              id="pincode"
                              value={addressForm.pincode}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, pincode: e.target.value })
                              }
                              placeholder="400001"
                              maxLength={6}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="address_type">Address Type</Label>
                            <Select
                              value={addressForm.address_type}
                              onValueChange={(value: AddressType) =>
                                setAddressForm({ ...addressForm, address_type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="both">Both (Shipping & Billing)</SelectItem>
                                <SelectItem value="shipping">Shipping Only</SelectItem>
                                <SelectItem value="billing">Billing Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-8">
                            <input
                              type="checkbox"
                              id="is_default"
                              checked={addressForm.is_default}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, is_default: e.target.checked })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="is_default" className="cursor-pointer">
                              Set as default address
                            </Label>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleAddressSubmit}
                            disabled={isCreating || isUpdating}
                            className="flex-1 bg-gray-900 hover:bg-gray-700"
                          >
                            {(isCreating || isUpdating) ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            {editingAddressId ? 'Update' : 'Save'} Address
                          </Button>
                          <Button
                            onClick={cancelAddressForm}
                            variant="outline"
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Address List */}
                  {addresses.length === 0 && !isAddingAddress ? (
                    <Card className="p-12 text-center border-gray-200">
                      <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2 font-sans">
                        No Addresses Yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Add your first address to make checkout faster
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <Card
                          key={address.id}
                          className={`border-2 transition-all ${
                            address.is_default
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 font-sans">
                                    {address.full_name}
                                  </h4>
                                  {address.is_default && (
                                    <Badge className="bg-gray-900 text-white">
                                      <Check className="w-3 h-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                    {address.address_type.charAt(0).toUpperCase() +
                                      address.address_type.slice(1)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {address.phone_number}
                                  </p>
                                  <p>
                                    {address.address_line1}
                                    {address.address_line2 && `, ${address.address_line2}`}
                                  </p>
                                  <p>
                                    {address.city}, {address.state} - {address.pincode}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {!address.is_default && (
                                  <Button
                                    onClick={() => handleSetDefault(address.id)}
                                    disabled={isUpdating}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300"
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      'Set Default'
                                    )}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleEditAddress(address.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  disabled={isDeleting}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};