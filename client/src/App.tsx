import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, UserPlus, Edit3, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../server/src/schema';

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recent');

  // Form state for creating new customers
  const [newCustomerForm, setNewCustomerForm] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Form state for editing existing customers
  const [editCustomerForm, setEditCustomerForm] = useState<UpdateCustomerInput>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Load recent customers on component mount
  const loadRecentCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getRecentCustomers.query();
      setRecentCustomers(result);
    } catch (error) {
      console.error('Failed to load recent customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentCustomers();
  }, [loadRecentCustomers]);

  // Handle creating a new customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCustomer.mutate(newCustomerForm);
      setRecentCustomers((prev: Customer[]) => [response, ...prev.slice(0, 9)]);
      setNewCustomerForm({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      setActiveTab('recent');
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating an existing customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.updateCustomer.mutate(editCustomerForm);
      setRecentCustomers((prev: Customer[]) => 
        prev.map(customer => customer.id === response.id ? response : customer)
      );
      setSelectedCustomer(response);
      setActiveTab('recent');
    } catch (error) {
      console.error('Failed to update customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await trpc.searchCustomers.query({ query: searchQuery });
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing a customer
  const startEditingCustomer = (customer: Customer) => {
    setEditCustomerForm({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setActiveTab('edit');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Customer CRM</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your customer relationships with ease ✨
          </p>
        </div>

        {/* Stub Implementation Alert */}
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            <strong>Note:</strong> This application uses stub backend implementations. 
            Customer data is not persisted and operations return placeholder data for demonstration purposes.
          </AlertDescription>
        </Alert>

        {/* Search Bar */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Search by name or email... 🔍"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setSearchQuery(e.target.value)
                }
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] lg:mx-auto">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!editCustomerForm.id} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Results
            </TabsTrigger>
          </TabsList>

          {/* Recent Customers Tab */}
          <TabsContent value="recent">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Recent Customers
                </CardTitle>
                <CardDescription>
                  Last 10 customers added to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading customers... ⏳</p>
                  </div>
                ) : recentCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No customers yet! 📝</p>
                    <p className="text-gray-400">Add your first customer to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentCustomers.map((customer: Customer) => (
                      <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {customer.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              ID: {customer.id}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span>{customer.created_at.toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => startEditingCustomer(customer)}
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Customer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add New Customer Tab */}
          <TabsContent value="add">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Add New Customer
                </CardTitle>
                <CardDescription>
                  Fill in the customer information below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCustomer} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Customer Name *
                      </label>
                      <Input
                        placeholder="Enter full name"
                        value={newCustomerForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCustomerForm((prev: CreateCustomerInput) => ({ 
                            ...prev, 
                            name: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        placeholder="customer@example.com"
                        value={newCustomerForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCustomerForm((prev: CreateCustomerInput) => ({ 
                            ...prev, 
                            email: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone Number *
                      </label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newCustomerForm.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCustomerForm((prev: CreateCustomerInput) => ({ 
                            ...prev, 
                            phone: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Address *
                      </label>
                      <Input
                        placeholder="123 Main St, City, State"
                        value={newCustomerForm.address}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCustomerForm((prev: CreateCustomerInput) => ({ 
                            ...prev, 
                            address: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Creating Customer...' : '✨ Create Customer'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Customer Tab */}
          <TabsContent value="edit">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-orange-600" />
                  Edit Customer
                </CardTitle>
                <CardDescription>
                  Update customer information (leave blank to keep current value)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editCustomerForm.id ? (
                  <form onSubmit={handleUpdateCustomer} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Customer Name
                        </label>
                        <Input
                          placeholder="Enter full name"
                          value={editCustomerForm.name || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditCustomerForm((prev: UpdateCustomerInput) => ({ 
                              ...prev, 
                              name: e.target.value 
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="customer@example.com"
                          value={editCustomerForm.email || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditCustomerForm((prev: UpdateCustomerInput) => ({ 
                              ...prev, 
                              email: e.target.value 
                            }))
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Phone Number
                        </label>
                        <Input
                          placeholder="(555) 123-4567"
                          value={editCustomerForm.phone || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditCustomerForm((prev: UpdateCustomerInput) => ({ 
                              ...prev, 
                              phone: e.target.value 
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Address
                        </label>
                        <Input
                          placeholder="123 Main St, City, State"
                          value={editCustomerForm.address || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditCustomerForm((prev: UpdateCustomerInput) => ({ 
                              ...prev, 
                              address: e.target.value 
                            }))
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        {isLoading ? 'Updating...' : '💾 Update Customer'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditCustomerForm({ id: 0, name: '', email: '', phone: '', address: '' });
                          setActiveTab('recent');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <Edit3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a customer from the Recent tab to edit</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Results Tab */}
          <TabsContent value="search">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-600" />
                  Search Results
                </CardTitle>
                <CardDescription>
                  {searchQuery && `Results for "${searchQuery}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No customers found 🔍</p>
                    <p className="text-gray-400">Try a different search term or check the spelling.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults.map((customer: Customer) => (
                      <Card key={customer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {customer.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              ID: {customer.id}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span>{customer.created_at.toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => startEditingCustomer(customer)}
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Customer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;